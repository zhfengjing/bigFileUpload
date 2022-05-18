import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import axios from '../customAxios';
import { Upload, Button, notification, Avatar, Progress, Spin } from 'antd';
import SparkMD5 from 'spark-md5';
import classNames from 'classnames';
import styles from '../styles/UserCenter.module.css';

const CHUNK_SIZE = 0.5 * 1024 * 1024;//计算大小

export default function UserCenter() {
    const [hash, setHash] = useState('');
    const [chunks, setChunks] = useState([]);
    const [fileList, setFileList] = useState([]);
    const [uploadLoading, setUploadLoading] = useState(false);
    const [percent, setPercent] = useState(0);
    const [hashProgress, setHashProgress] = useState(0);
    const [avatarSrc, setAvatarSrc] = useState('');
    const [userInfo, setUserInfo] = useState(null);
    useEffect(() => {
        axios.post('/api/user/info').then(res => {
            if (res.code === 0) {
                setUserInfo(res.data);
                setAvatarSrc(res.data.avatar);
            }
        })
    }, [])

    const createFileChunks = (file, size = CHUNK_SIZE) => {
        const chunks = [];
        let cur = 0;
        while (cur < file.size) {
            chunks.push({
                index: cur,
                file: file.slice(cur, cur + size),
            })
            cur += size;
            // 处理文件最后有可能遗留的情况
            if (cur >= file.size) {
                chunks.push({
                    index: cur,
                    file: file.slice(cur)
                })
                break;
            }
        }
        return chunks;
    }
    const calculateHash = chunks => {
        return new Promise(resolve => {
            // 创建一个工作进程（计算上传图片的hash(使用webworker来计算，即利用浏览器空闲间隙来计算，避免 主线程阻塞卡顿等问题)）
            const worker = new Worker('/hash.js');
            // console.log('worker', worker);
            // 给进程发送消息来计算hash
            worker.postMessage({ chunks });
            // 监听进程发来的消息
            worker.onmessage = e => {
                // console.log('worker-onmessage', e);
                const { progress, hash } = e.data;
                setHashProgress(Number(progress.toFixed(2)));
                if (hash) {
                    resolve(hash);
                }
            }
        })
    }

    const calculateHashIdle = chunks => {
        return new Promise(resolve => {
            const spark = new SparkMD5.ArrayBuffer();
            // console.log('calculateHashIdle-spark', spark);
            let count = 0;
            const appendToSpark = fileChunk => {
                return new Promise(resolve => {
                    const reader = new FileReader();
                    reader.onload = e => {
                        spark.append(e.target.result);
                        resolve();
                    }
                    reader.readAsArrayBuffer(fileChunk);
                })
            }
            const workLoop = async deadline => {
                while (count < chunks.length && deadline.timeRemaining() > 1) {
                    await appendToSpark(chunks[count].file);
                    count++;
                    if (count === chunks.length) {
                        setHashProgress(100);
                        resolve(spark.end());
                    } else {
                        setHashProgress(Number(100 * count / chunks.length).toFixed(2));
                    }
                }
                window.requestIdleCallback(workLoop);
            }
            window.requestIdleCallback(workLoop);
        })

    }

    const calculateHashSample = () => {
        return new Promise(async resolve => {
            const spark = new SparkMD5.ArrayBuffer();
            const file = fileList[0];
            const chunks = [];
            const size = file.size;
            const offset = 2 * 1024 * 1024;
            let cur = offset;
            // 第一个2M全要
            chunks.push(file.slice(0, offset));
            while (cur < size) {
                if (cur + offset >= size) {
                    // 最后一个区块全要
                    chunks.push(file.slice(cur, cur + offset));
                } else {
                    // 中间的区块取前中后三个部分
                    const mid = cur + offset / 2;
                    const end = cur + offset;
                    chunks.push(file.slice(cur, cur + 2));
                    chunks.push(file.slice(mid, mid + 2));
                    chunks.push(file.slice(end, end - 2));
                }
                cur += offset;
            }
            // console.log('calculateHashSample-chunks', chunks);
            // 将chunks生成hash的两种方式
            // 第一种
            // let count = 0;
            // while (count < chunks.length) {
            //     await appendToSpark(chunks[count],spark);
            //     count++;
            //     if (count === chunks.length) {
            //         setHashProgress(100);
            //         resolve(spark.end());
            //     } else {
            //         setHashProgress(Number(100 * count / chunks.length).toFixed(2));
            //     }
            // }
            // 第二种
            const reader = new FileReader();
            reader.onload = e => {
                spark.append(e.target.result);
                resolve(spark.end());
            }
            // console.log('new Blob(chunks)',new Blob(chunks));
            reader.readAsArrayBuffer(new Blob(chunks))
        })

    }
    const appendToSpark = (fileChunk, spark) => {
        return new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = e => {
                spark.append(e.target.result);
                resolve();
            }
            reader.readAsArrayBuffer(fileChunk);
        })
    }

    const uploadFile = async () => {
        // 对文件进行分片
        const chunks = createFileChunks(fileList[0]);
        console.log('chunks', chunks);
        // 计算上传图片的hash(使用webworker来计算，避免 主线程阻塞卡顿等问题)
        const hash = await calculateHash(chunks);
        // 利用浏览器的空闲间隙来计算hash
        // const hash1 = await calculateHashIdle(chunks);
        // 抽样hash 取第一个区块2M,最后一个区块全要，中间部分取前中后三个部分
        // const hash2 = await calculateHashSample();
        console.log('hash=', hash);
        // console.log('hash1=', hash1);
        // console.log('hash2=', hash2);
        setHash(hash);

        //  检查文件是否已上传到后端或者已上传了部分切片文件
        const { uploaded, uploadedList, url } = await checkFile(hash);
        // 对文件进行切片数据整理
        const newChunks = chunks.map((chunk, index) => {
            const name = hash + '-' + index;
            return {
                index,
                chunk: chunk.file,
                hash,
                name,
                progress: (uploadedList && uploadedList.indexOf(name) > -1) ? 100 : 0 //把已经上传到后端的文件切片的进度更改为100
            }
        })
        if (uploaded) {
            setChunks(newChunks.map(chunk => {
                chunk.progress = 100;
                return chunk;
            }));
            setFileList([]);
            setAvatarSrc(url);
            return notification.success({
                message: 'Success',
                description: '秒传成功'
            })
        }

        await setChunks(newChunks);
        // console.log('test-setChuanks', chunks);//此处取不到setChunks后的chunks值？
        const willUploadChunks = newChunks.filter(item => {
            return uploadedList && uploadedList.indexOf(item.name) === -1;
        })
        await uploadChunks(newChunks, willUploadChunks, hash);
        // 如下是最初始化最简单的的方式上传
        // const formData = new FormData();
        // formData.append('name', 'file');
        // formData.append('file', fileList[0]);
        // setUploadLoading(true);
        // axios.post('/api/uploadfile', formData, {
        //     onUploadProgress: progress => {
        //         console.log('progress=', progress);
        //         const percent = Number(((progress.loaded / progress.total) * 100).toFixed(2));
        //         setPercent(percent);
        //     }
        // }).then(res => {
        //     if (res.code === 0) {
        //         setAvatarSrc(res.data.url);
        //         notification.success({
        //             message: 'Success',
        //             description: '上传成功'
        //         })
        //         setFileList([]);
        //     } else {
        //         notification.error({
        //             message: 'Failed',
        //             description: '上传失败'
        //         })
        //     }

        //     setUploadLoading(false);
        // })
    }
    const checkFile = async (hash) => {
        // 上传之前先给后端发个请求，验证下该文件是否已上传,如果已上传，则提示客户秒传成功
        const { code, data: { uploaded, uploadedList, url } = {} } = await axios.post('/api/checkFile', {
            hash,
            ext: fileList[0].name.split('.').pop()
        })
        return { uploaded, uploadedList, url };
    }

    const uploadChunks = async (chunks, uploadChunks, hash) => {
        // console.log('uploadChunks', uploadChunks, chunks);
        const promiseChunks = uploadChunks.map((chunk) => {
            const formData = new FormData();
            const { name, hash, index, chunk: file } = chunk;
            formData.append('name', name);
            formData.append('hash', hash);
            formData.append('chunk', file);
            formData.append('index', index);
            return { formData, index, error: 0 };//error记录上传报错次数
        })
        // .map(({ formData, index }) => axios.post('/api/uploadfile', formData, {
        //     onUploadProgress: progress => {
        //         chunks[index].progress = Number(((progress.loaded / progress.total) * 100).toFixed(2));
        //         console.log(`${chunks[index]}=`, chunks[index]);
        //         setChunks([...chunks]);
        //     }
        // }))
        // // 切片一次全部上传(这种方式一次发出很多个请求时，会造成浏览器卡顿问题)
        // await Promise.all(promiseChunks).then(res => {
        //     console.log('uploadChunks-then-res', res);
        // })
        // 切片上传进行并发数控制，限制一次可以发送几个异步请求，一个完成后再添加进去一个新的请求
        await sendRequest(chunks, promiseChunks);

        // 切片上传成功后发送一个合并文件的请求，后端进行文件合并
        await mergeUploadFile(hash);
    }
    const sendRequest = async (chunks, promiseChunks, limit = 4) => {
        // limit为并发数控制数量，默认为4个
        return new Promise((resolve, reject) => {
            let len = promiseChunks.length;
            let count = 0;//记录请求次数
            let isStop = false;//标识上传失败三次后停止上传任务
            const start = async () => {
                if (isStop) { return }
                const task = promiseChunks.shift();//从待请求任务中弹出一个任务
                if (task) {
                    const { formData, index } = task;
                    try {
                        let result = await axios.post('/api/uploadfile', formData, {
                            onUploadProgress: progress => {
                                chunks[index].progress = Number(((progress.loaded / progress.total) * 100).toFixed(2));
                                console.log(`${chunks[index]}=`, chunks[index]);
                                setChunks([...chunks]);
                            }
                        })
                        console.log('result=', result);
                        if (count === len - 1) {//最后一个任务
                            resolve();
                        } else {
                            count++;
                            start();
                        }
                    } catch (error) {
                        // 如果上传报错，则将上传的进度progress置为-1，红色显示
                        // 如果报错小于三次，则重试上传，如果大于三次，则全部停止上传功能
                        chunks[index].progress = -1;
                        if (task.error < 3) {
                            task.error++;
                            promiseChunks.unshift(task);
                            start();
                        } else {
                            isStop = true;
                            reject();
                        }
                        setChunks([...chunks]);

                    }

                }
            }
            while (limit > 0) {
                start();
                limit -= 1;
            }
        })

    }

    const mergeUploadFile = (hash) => {
        axios.post('/api/mergeUploadFile', {
            hash,
            size: CHUNK_SIZE,
            ext: fileList[0].name.split('.')[1]
        }).then(res => {
            if (res.code === 0) {
                setAvatarSrc(res.data.url);
                notification.success({
                    message: 'Success',
                    description: '上传成功'
                })
                setFileList([]);
            }

        })
    }

    const calcUploadPercent = useMemo(() => {
        if (!fileList || fileList.length === 0 || chunks.length === 0) {
            return 0;
        }
        const loaded = chunks.map(chunk => {
            return chunk.progress * chunk.chunk.size
        }).reduce((acc, next) => (acc + next), 0);
        return parseFloat(loaded / fileList[0].size).toFixed(2)
    }, [chunks])

    const isImage = async file => {
        const fileTypes = {
            'gif': isGif,
            'jpg': isJpg,
            'jpeg': isJpg,
            'png': isPng,
            // 'psd': isPsd
        };
        console.log('isImage', file);
        const lastIndex = file.name.lastIndexOf('.');
        const fileType = file.name.substr(lastIndex + 1);
        console.log('fileType', fileType);
        const fileTypeFunc = fileTypes[fileType];
        console.log('fileTypeFunc', fileTypeFunc, typeof fileTypeFunc);
        return await fileTypes[fileType](file);
    }
    const isGif = async file => {
        // gif图片 文件头标识 (6 bytes)   47 49 46 38 39(37) 61，字符即：   G    I   F   8    9 (7)   a

        console.log('isGif-file', file, file.slice(0, 6));
        const ret = await blobToString(file.slice(0, 6));
        const ret1 = await transferWH(file.slice(6, 4));

        return ret === '47 49 46 38 39 61' || ret === '47 49 46 38 37 61';
    }
    const isJpg = async file => {
        // jpeg图片 文件头标识 (2 bytes): 0xff, 0xd8 (SOI) (JPEG 文件标识)
        // - 文件结束标识 (2 bytes): 0xff, 0xd9 (EOI)
        console.log('isJpg-file', file, file.slice(0, 2), file.slice(-2));
        const start = await blobToString(file.slice(0, 2));
        const tail = await blobToString(file.slice(-2, file.length));
        return start === 'FF D8' && tail === 'FF D9';
    }
    const isPng = async file => {
        // png图片 文件头标识 89 50 4E 47 0D 0A 1A 0A
        console.log('isPng-file', file, file.slice(0, 8), file.slice(-2));
        const ret = await blobToString(file.slice(0, 8));
        return ret === '89 50 4E 47 0D 0A 1A 0A';
    }
    const blobToString = (blob) => {
        return new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = function () {
                console.log('reader-result', reader.result);
                const ret = reader.result.split('')
                    .map(v => v.charCodeAt())
                    .map(v => v.toString(16))
                    .map(v => v.toUpperCase())
                    .map(v => v.padStart(2, '0'))
                    .join(' ');
                console.log('reader-ret', ret);
                resolve(ret);
            }
            reader.readAsBinaryString(blob);
        })
    }
    const transferWH = (blob) => {
        return new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = function () {
                console.log('reader-result', reader.result);
                // const ret = reader.result.split('')
                //     .map(v => v.charCodeAt())
                //     .map(v => v.toString(16))
                //     .map(v=>v.toUpperCase())
                //     .map(v=>v.padStart(2,'0'))
                //     .join(' ');
                // console.log('reader-ret', ret);
                // resolve(ret);
                resolve()
            }
            reader.readAsText(blob);
        })
    }
    const uploadProps = {
        action: '/',
        listType: 'picture',
        onRemove: (file) => {
            setFileList(fileList.filter(item => item !== file))
        },
        beforeUpload: async (file) => {
            // 判断上传的文件格式是否正确，需要根据图片头信息的16进制来判断
            console.log('beforeUpload', file);
            const result = await isImage(file);
            if (!result) {
                alert('文件格式不对');
                return;
            } else {
                console.log('文件格式正确');
            }
            setFileList([...fileList, file]);
            setChunks([]);
            setPercent(0);
            setHashProgress(0);
            return false;
        },
        // process:{
        //     percent,
        //     strokeWidth: 10, 
        //     showInfo: true
        // },
        fileList
    }
    return <div className={styles.userCenter}>
        <h4>用户中心</h4>
        <Avatar src={avatarSrc} size={64} style={{ margin: '16px auto' }}>User</Avatar>
        <Link href='/' passHref >
            <Button  type='primary' style={{marginLeft:'16px'}}>去首页</Button>
        </Link>
        <br />
        <br />
        <Upload {...uploadProps} className={styles['upload-area']} style={{ minWidth: '200px', padding: '12px 16px', textAlign: 'center' }}>
            <Button>选择图片或文件</Button>
        </Upload>
        <Button type='primary' onClick={uploadFile} disabled={uploadLoading || fileList.length === 0} style={{ marginTop: '24px', marginBottom: '24px' }}>{uploadLoading ? '上传中' : '上传'}</Button>
        <h4>计算上传进度</h4>
        <Progress percent={calcUploadPercent} strokeWidth={10} className={styles.progress} />
        {/* <Progress percent={percent} strokeWidth={10} className={styles.progress} /> */}
        <h4>计算hash进度</h4>
        <Progress percent={hashProgress} strokeWidth={10} status='active' className={styles.progress} />
        <h4>计算切片上传进度</h4>
        <div className={styles["cube-container"]} style={{ width: Math.ceil(Math.sqrt(chunks.length)) * 16 + 'px' }}>
            {
                chunks && chunks.length > 0 && chunks.map((chunk, index) => {
                    return <div className={styles.cube} key={chunk.name}>
                        <div
                            // className={classNames({
                            //     success: chunk.progress === 100,
                            //     uploading: chunk.progress > 0 && chunk.progress < 100,
                            //     error: chunk.progress <= 0
                            // })}
                            className={chunk.progress === 100 ? styles.success : (chunk.progress > 0 && chunk.progress < 100 ? styles.uploading : styles.error)}
                            style={{ height: chunk.progress + '%' }}>
                            <Spin spinning={chunk.progress > 0 && chunk.progress < 100}></Spin>
                        </div>
                    </div>
                })
            }
        </div>
    </div>
}