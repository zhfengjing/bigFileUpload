import {Modal} from 'antd';
const axios=require('axios');

const instance=axios.create({
    // baseUrl:'/',
    // timeout:3000
})
// 请求拦截器
    instance.interceptors.request.use(function(config){
        // 请求发送前对数据的处理
        console.log('request-interceptors-config',config);
        // config.request
        const token=localStorage.getItem('token');
        token && (config.headers.common['Authorzation']='Bearer '+token);
        return config;
    },function(error){
        // 请求错误时处理
        return Promise.reject(error);
    })


// 响应拦截器
instance.interceptors.response.use(function(response){
    // 对响应数据的处理
    console.log('interceptors-response',response);
    const {status,data}=response;
    if(status===200){
        if(data.code===-2){
            Modal.warning({
                title:'警告',
                content:data.message,
                okText:'去登录',
                cancelButtonProps:{style:{display:'none'}},
                onOk(){
                    window.location.href='/login';
                }
            })
        }
        return data;
    }else{
        return data;
    }
},function(error){
// 对响应数据错误的处理
return Promise.reject(error);
})

export default instance;