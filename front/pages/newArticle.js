import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Form, Input, Button, message, Row, Col } from "antd";
import axios from "../customAxios";
const TextArea = Input.TextArea;
export default function NewArticle() {
    return <Row gutter={32}>
        <Col span={12}>
            <TextArea style={{ height: '90vh' }}></TextArea>
        </Col>
        <Col span={12}>
            <div className="markdown-body">

            </div>
        </Col>
    </Row>
}