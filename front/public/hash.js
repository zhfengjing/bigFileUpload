// 引入spark-md5文件，引入方式使用importScripts,这是webworker引入文件的方式
self.importScripts('spark-md5.min.js');
// 监听消息
self.onmessage=e=>{
    // console.log('self-onmessage',e);
    const {chunks}=e.data;
    let count=0;
    let progress=0;
    const spark=new self.SparkMD5.ArrayBuffer();//生成一个sparkMd5的arrayBuffer的实例
    console.log('hash--spark',spark);
   const loadText=index=>{
        const reader=new FileReader();
        reader.onload=e=>{
            count++;
            // 将数据添加到spark里
            // console.log('e.target.result',e.target.result);
            spark.append(e.target.result);
            // chunks分片解析hash结束,告知主线程
            if(count===chunks.length){
                self.postMessage({
                    hash:spark.end(),
                    progress:100
                })
            }else{
                // 告知主线程目前hash解析的进度
                progress+=100*count/chunks.length;
                self.postMessage({
                    progress
                    // progress:count/chunks.length
                })
                // 继续解析
                loadText(count);
            }
        }
        reader.readAsArrayBuffer(chunks[index].file)
   }
   loadText(count);
}