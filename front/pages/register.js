import React, { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { Form, Input, Button, message, Modal } from "antd"
import axios from "../customAxios";
import md5 from 'md5';
import style from "../styles/Login.module.css";
const FormItem = Form.Item

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
export default function Register() {
  const [form] = Form.useForm()
  const [timer, setTimer] = useState(5)
  console.log("form=", form)
  const updateCaptchaUrl = async () => {
    document.getElementById("verifyCode").src =
      "http://localhost:3000/api/captcha?T=" + new Date().getTime()
  }
  const onFinish = (values) => {
    console.log("Success:", values);
    values.password=md5(values.password);
    values.confirmPassword=md5(values.confirmPassword);
    axios
      .post("api/user/register", values)
      .then((res) => {
        console.log('register-res',res);
        const {code,data,message}=res;
        if ( code===0) {
          // message.success('注册成功');
          // const interval = setInterval(() => {
          //   if (timer < 0) {
          //     clearInterval(interval)
          //     window.location.href = "/login";
          //   }
          //   setTimer(--timer)
          // }, 1000)
          Modal.success({
            title: data,
            content: "即将跳转到登录页面",
            okText:'立即前往',
            onOk:()=>{
                window.location.href = "/login";
            }
          })
        }else{
          Modal.error({
            title:'Error',
            content:message
          })
        }
      })
      .catch((err) => {
        console.log("err=", err)
      })
  }

  const onFinishFailed = (errorInfo) => {
    console.log("Failed:", errorInfo)
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
          initialValue="123@163.com"
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
          label="Username"
          name="username"
          initialValue="aaa"
          rules={[
            {
              required: true,
              message: "Please input your username!",
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
          label="confirmPassword"
          name="confirmPassword"
          initialValue="123"
          rules={[
            {
              required: true,
              message: "Please input your confirPpassword!",
            },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue("password") === value) {
                  return Promise.resolve()
                }

                return Promise.reject(
                  new Error("The two passwords that you entered do not match!")
                )
              },
            }),
          ]}
        >
          <Input.Password />
        </Form.Item>
        <Form.Item
          label="验证码"
          name="verificationCode"
          initialValue=""
          rules={[
            {
              required: true,
              message: "Please input your verificationCode!",
            },
          ]}
          extra={
            <img
              // layout="fill"
              src="/api/captcha"
              onClick={updateCaptchaUrl}
              id="verifyCode"
              alt="验证码图片"
            ></img>
          }
        >
          <Input placeholder="验证码" />
        </Form.Item>
        <Form.Item
          wrapperCol={{
            offset: 8,
            span: 16,
          }}
        >
          <Button type="primary" htmlType="submit">
            Register
          </Button>
        </Form.Item>
      </Form>
    </div>
  )
}
