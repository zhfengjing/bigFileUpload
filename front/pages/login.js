import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Form, Input, Button,message } from "antd";
import axios from "../customAxios";
import md5 from "md5";
import style from "../styles/Login.module.css";
const FormItem = Form.Item;

// export async function getStaticProps() {
//   // Call an external API endpoint to get posts.
//   // You can use any data fetching library
//   const res = await axios.get('http:localhost:3000/api/captcha');
//   console.log('res=',res);
//   let captchaUrl = res.json()
//   const updateCaptchaUrl = async () => {
//     const res = await axios.get("/api/captcha");
//     // console.log('updateCaptchaUrl-res=',res);
//     captchaUrl = await res.json();
//   };
//   // By returning { props: { posts } }, the Blog component
//   // will receive `posts` as a prop at build time
//   return {
//     props: {
//       captchaUrl,
//       // updateCaptchaUrl,
//       fallback: false,
//     },
//   };
// }

// // export async function getServerSideProps(context) {
//   const res = await axios.get("http://localhost:3000/api/captcha");
//   console.log('getServerSideProps-res',res);
//   let captcha = res;

//   if (!captcha) {
//     return {
//       notFound: true,
//     }
//   }
//   // const updateCaptchaUrl=async()=>{
//   //   const res = await axios.get("http://localhost:3000/api/captcha");
//   //   // console.log('getServerSideProps-res',res);
//   //    captcha = res;
//   // }

//   return {
//     props: {captchaUrl:captcha.data}, // will be passed to the page component as props
//   }
// }
export default function Login() {
  const [form] = Form.useForm();
  const imgRef=useRef(null);
  const [disabled,setDisabled]=useState(false);
  const [timer,setTimer]=useState(10);
  console.log('form=',form);
  const onFinish = (values) => {
    console.log("Success:", values);
    values.password=md5(values.password);
    // axios.post('/api/captcha?values='+JSON.stringify(values)).then(res=>{
    axios
      .post("api/user/login", values)
      .then((res) => {
        console.log("login-res=", res);
        if(res.code===0){
          localStorage.setItem('token',res.data.token);
          window.location.href='/usercenter';
        }
      })
      .catch((err) => {
        console.log("login-err=", err);
      });
  };

  const onFinishFailed = (errorInfo) => {
    console.log("Failed:", errorInfo);
  };

  const updateCaptchaUrl = async () => {
    imgRef.src =
      "http://localhost:3000/api/captcha?T=" + new Date().getTime()
  }

  const sendEmailCode=async()=>{
    setDisabled(true);
    axios.get('/api/sendEmailCode?email='+form.getFieldValue('email'));
    const interval=setInterval(()=>{
      if(timer<=0){
        clearInterval(interval);
        setDisabled(false);
      setTimer(10);
      }
      timer--;
      setTimer(timer);
    },1000)
  }

  return (
    <div className={style["login-page"]}>
      <Form
        layout="horizontal"
        name="basic"
        className={style["login-form"]}
        labelCol={{
          span: 8,
        }}
        wrapperCol={{
          span: 16,
        }}
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
        autoComplete="off"
        form={form}
      >
       <Form.Item
          label="邮箱"
          name="email"
          initialValue="fengjing550@163.com"
          rules={[
            {
              type: "email",
              message: "The input is not valid E-mail!",
            },
            {
              required: true,
              message: "Please input your E-mail!",
            },
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          label="Password"
          name="password"
          initialValue="123"
          rules={[
            {
              required: true,
              message: "Please input your password!",
            },
          ]}
        >
          <Input.Password />
        </Form.Item>
        <Form.Item
          label="邮箱验证码"
          name="emaiCode"
          initialValue=""
          rules={[
            {
              required: true,
              message: "Please input your email code!",
            },
          ]}
          extra={
            <Button
              type="primary"
              onClick={sendEmailCode}
              disabled={disabled}
              className={style['sendEmailCodeBtn']}
              style={{right:disabled?'-120px':'-80px'}}
            >{disabled && `${timer}s后`}发送</Button>
          }
        >
          <Input placeholder="邮箱验证码" />
        </Form.Item>
        <Form.Item
          wrapperCol={{
            offset: 8,
            span: 16,
          }}
        >
          <Button
            type="primary"
            htmlType="submit"
            style={{ marginLeft: "24px" }}
          >
            Login
          </Button>
          <span style={{marginLeft:'16px'}}>
            还未注册，去<Link href='/register'>注册</Link>
          </span>
        </Form.Item>
      </Form>
    </div>
  );
}
