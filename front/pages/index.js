import React, { useState, useEffect } from 'react';
import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link';
import styles from '../styles/Home.module.css'
import { Layout, Menu, Avatar,Button } from 'antd'
import axios from '../customAxios';

const { Header, Content, Footer } = Layout;
const MenuItem = Menu.Item;
export default function Home() {
  const [userInfo, setUserInfo] = useState(null);
  useEffect(() => {
    axios.post('/api/user/info').then(res => {
      if (res.code === 0) {
        setUserInfo(res.data);
      }
    })
  }, [])
  return (
    <div className={styles.container}>
      <Layout>
        <Header style={{textAlign:'right'}}>
        {/* <Link href='/newArticle' passHref><Button type='primary'>写文章</Button></Link> */}
          <Menu mode='horizontal' className={styles.menu} theme='dark'>
            <MenuItem><Link href='/newArticle' passHref><Button type='primary'>写文章</Button></Link></MenuItem>
            {!userInfo && <MenuItem><Link href='/login'>登录</Link></MenuItem>}
            {!userInfo && <MenuItem><Link href='/register'>注册</Link></MenuItem>}
          </Menu>
          <Link href='/usercenter' passHref ><Avatar className={styles.userAvatar} src={userInfo ? '/api'+userInfo.avatar : ''} icon='user' /></Link>
        </Header>
        <Content className={styles.content}>
          content
        </Content>
        <Footer>
          scenery At 2022.5.10
        </Footer>
      </Layout>
    </div>
  )
}
