'use client';
import {ProChat } from '@ant-design/pro-chat';
import { useTheme } from 'antd-style';
import { useEffect, useState } from 'react';
export default function Home() {
  const theme = useTheme();
  const [showComponent, setShowComponent] = useState(false);
  const [token, setToken] = useState('');

  useEffect(() => {
    setShowComponent(true);

    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    }
  }, []);


  return (
    <div
      style={{
        backgroundColor: theme.colorBgLayout,
      }}
    >
      {showComponent && (
        <ProChat
          style={{
            height: '100vh',
            width: '100vw',
          }}
          request={async (messages) => {
            const response  = await fetch('/api/v2/chat', {
              method: 'POST',
              body: JSON.stringify({ messages: messages }),
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
            });
            const r = response.body as ReadableStream<Uint8Array>
            const reader = r.getReader();
            const decoder = new TextDecoder('utf-8');
            const encoder = new TextEncoder();

            const readableStream = new ReadableStream({
                async start(controller) {
                    function push() {
                        reader
                            .read()
                            .then(({done, value}) => {
                                if (done) {
                                    controller.close();
                                    return;
                                }
                                const message = decoder.decode(value, {stream: true}).replace('data: ', '');
                                controller.enqueue(encoder.encode(message));
                                push();
                            })
                            .catch((err) => {
                                console.error('读取流中的数据时发生错误', err);
                                controller.error(err);
                            });
                    }

                    push();
                },
            });
            return new Response(readableStream);

          }}
        />
      )}
    </div>
  );
}
