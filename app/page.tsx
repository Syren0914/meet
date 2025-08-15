'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import React, { Suspense, useState } from 'react';
import { encodePassphrase, generateRoomId, randomString } from '@/lib/client-utils';
import Image from 'next/image';
import styles from '../styles/Home.module.css';
import { Input } from '@/components/ui/input';
import dynamic from 'next/dynamic';
import Viewer from '@/components/viewer';

function Tabs(props: React.PropsWithChildren<{}>) {
  const searchParams = useSearchParams();
  const Viewer = dynamic(() => import("@/components/viewer"), { ssr: false });
  const tabIndex = searchParams?.get('tab') === 'custom' ? 1 : searchParams?.get('tab') === 'join' ? 2 : 0;

  const router = useRouter();
  function onTabSelected(index: number) {
    const tab = index === 1 ? 'custom' : index === 2 ? 'join' : 'demo';
    router.push(`/?tab=${tab}`);
  }

  let tabs = React.Children.map(props.children, (child, index) => {
    return (
      <button
        className="lk-button"
        onClick={() => {
          if (onTabSelected) {
            onTabSelected(index);
          }
        }}
        aria-pressed={tabIndex === index}
      >
        {/* @ts-ignore */}
        {child?.props.label}
      </button>
    );
  });

  return (
    <div className={styles.tabContainer}>
      <div className={styles.tabSelect}>{tabs}</div>
      {/* @ts-ignore */}
      {props.children[tabIndex]}
    </div>
  );
}

function DemoMeetingTab(props: { label: string }) {
  const router = useRouter();
  const [e2ee, setE2ee] = useState(false);
  const [sharedPassphrase, setSharedPassphrase] = useState(randomString(64));
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState('');
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);

  const startMeeting = () => {
    if (!currentRoomId) {
      // If no invite was sent, generate a new room
      const newRoomId = generateRoomId();
      setCurrentRoomId(newRoomId);
      if (e2ee) {
        router.push(`/rooms/${newRoomId}#${encodePassphrase(sharedPassphrase)}`);
      } else {
        router.push(`/rooms/${newRoomId}`);
      }
    } else {
      // Use the same room ID from the invite
      if (e2ee) {
        router.push(`/rooms/${currentRoomId}#${encodePassphrase(sharedPassphrase)}`);
      } else {
        router.push(`/rooms/${currentRoomId}`);
      }
    }
  };

  const sendInvite = async () => {
    if (!email) {
      setMessage('Please enter an email address');
      return;
    }

    setIsSending(true);
    setMessage('');

    try {
      const roomId = generateRoomId();
      const roomUrl = `https://468b8b3878f4.ngrok-free.app/rooms/${roomId}`;
      
      // Store the room ID so host can join the same room
      setCurrentRoomId(roomId);
      
      const response = await fetch('/api/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          roomUrl,
          roomId,
          firstName: email.split('@')[0], // Extract name from email
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage('Meeting invite sent successfully! Check your email. Now click "Start Meeting" to join the same room.');
        setEmail('');
      } else {
        setMessage(`Error: ${result.error || 'Failed to send invite'}`);
      }
    } catch (error) {
      setMessage('Error sending invite. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className={styles.tabContent}>
      <p style={{ margin: 0 }}>Try Looplet Meet for free with our live demo project.</p>

      <div className="flex flex-col gap-4">
        <Input 
          type="email" 
          placeholder="Please enter your email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      
      {message && (
        <div style={{ 
          marginTop: '1rem', 
          padding: '0.5rem', 
          borderRadius: '4px',
          backgroundColor: message.includes('Error') ? '#fee' : '#efe',
          color: message.includes('Error') ? '#c00' : '#0a0'
        }}>
          {message}
        </div>
      )}

      <button 
        style={{ marginTop: '1rem' }} 
        className="lk-button" 
        onClick={sendInvite}
        disabled={isSending}
      >
        {isSending ? 'Sending...' : 'Send Invite'}
      </button>
      
      <button style={{ marginTop: '1rem' }} className="lk-button" onClick={startMeeting}>
        Start Meeting
      </button>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'row', gap: '1rem' }}>
          <input
            id="use-e2ee"
            type="checkbox"
            checked={e2ee}
            onChange={(ev) => setE2ee(ev.target.checked)}
          ></input>
          <label htmlFor="use-e2ee">Enable end-to-end encryption</label>
        </div>
        {e2ee && (
          <div style={{ display: 'flex', flexDirection: 'row', gap: '1rem' }}>
            <label htmlFor="passphrase">Passphrase</label>
            <input
              id="passphrase"
              type="password"
              value={sharedPassphrase}
              onChange={(ev) => setSharedPassphrase(ev.target.value)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function CustomConnectionTab(props: { label: string }) {
  const router = useRouter();

  const [e2ee, setE2ee] = useState(false);
  const [sharedPassphrase, setSharedPassphrase] = useState(randomString(64));

  const onSubmit: React.FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    const formData = new FormData(event.target as HTMLFormElement);
    const serverUrl = formData.get('serverUrl');
    const token = formData.get('token');
    if (e2ee) {
      router.push(
        `/custom/?LoopletUrl=${serverUrl}&token=${token}#${encodePassphrase(sharedPassphrase)}`,
      );
    } else {
      router.push(`/custom/?LoopletUrl=${serverUrl}&token=${token}`);
    }
  };
  return (
    <form className={styles.tabContent} onSubmit={onSubmit}>
      <p style={{ marginTop: 0 }}>
        Connect Looplet Meet with a custom server using Looplet Cloud or Looplet Server.
      </p>
      <input
        id="serverUrl"
        name="serverUrl"
        type="url"
        placeholder="Looplet Server URL: wss://*.Looplet.cloud"
        required
      />
      <textarea
        id="token"
        name="token"
        placeholder="Token"
        required
        rows={5}
        style={{ padding: '1px 2px', fontSize: 'inherit', lineHeight: 'inherit' }}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'row', gap: '1rem' }}>
          <input
            id="use-e2ee"
            type="checkbox"
            checked={e2ee}
            onChange={(ev) => setE2ee(ev.target.checked)}
          ></input>
          <label htmlFor="use-e2ee">Enable end-to-end encryption</label>
        </div>
        {e2ee && (
          <div style={{ display: 'flex', flexDirection: 'row', gap: '1rem' }}>
            <label htmlFor="passphrase">Passphrase</label>
            <input
              id="passphrase"
              type="password"
              value={sharedPassphrase}
              onChange={(ev) => setSharedPassphrase(ev.target.value)}
            />
          </div>
        )}
      </div>

      <hr
        style={{ width: '100%', borderColor: 'rgba(255, 255, 255, 0.15)', marginBlock: '1rem' }}
      />
      <button
        style={{ paddingInline: '1.25rem', width: '100%' }}
        className="lk-button"
        type="submit"
      >
        Connect
      </button>
    </form>
  );
}

function JoinRoomTab(props: { label: string }) {
  const router = useRouter();
  const [roomId, setRoomId] = useState('');
  const [message, setMessage] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const joinMeeting = async () => {
    if (!roomId) {
      setMessage('Please enter a room ID');
      return;
    }

    setIsJoining(true);
    setMessage('');

    try {
      if (roomId.includes('#')) {
        const [roomIdPart, passphrasePart] = roomId.split('#');
        router.push(`/rooms/${roomIdPart}#${passphrasePart}`);
      } else {
        router.push(`/rooms/${roomId}`);
      }
    } catch (error) {
      setMessage('Error joining room. Please try again.');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className={styles.tabContent}>
      <p style={{ margin: 0 }}>Join an existing Looplet Meet room.</p>

      <div className="flex flex-col gap-4">
        <Input 
          type="text" 
          placeholder="Enter Room ID (e.g., 1234567890abcdef)" 
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
        />
      </div>
      
      {message && (
        <div style={{ 
          marginTop: '1rem', 
          padding: '0.5rem', 
          borderRadius: '4px',
          backgroundColor: message.includes('Error') ? '#fee' : '#efe',
          color: message.includes('Error') ? '#c00' : '#0a0'
        }}>
          {message}
        </div>
      )}

      <button 
        style={{ marginTop: '1rem' }} 
        className="lk-button" 
        onClick={joinMeeting}
        disabled={isJoining}
      >
        {isJoining ? 'Joining...' : 'Join Room'}
      </button>
    </div>
  );
}

export default function Page() {
  return (
    <>
      <main className={styles.main} data-lk-theme="default">
        <div className="header">
          <div className='flex'>
          <Viewer />
          <Image src={'/images/looplet-text.png'} alt={'Looplet Meet'} width={360} height={45}></Image>
          </div>
          <h2>
            Video conferencing app built for Looplet {' '}
            <a href="https://github.com/Looplet/components-js?ref=meet" rel="noopener">
              Fast&nbsp;,Reliable&nbsp;
            </a>
            ,{'and'}
            <a href="https://Looplet.io/cloud?ref=meet" rel="noopener">
             &nbsp;Secure
            </a>{' '}
            
          </h2>
        </div>
        <Suspense fallback="Loading">
          <Tabs>
            <DemoMeetingTab label="Demo" />
            <CustomConnectionTab label="Custom" />
            <JoinRoomTab label="Join Room" />
          </Tabs>
        </Suspense>
      </main>
      <footer data-lk-theme="default">
        Hosted on{' '}
        <a href="https://Looplet.io/cloud?ref=meet" rel="noopener">
          Looplet Cloud
        </a>
        . Source code on{' '}
        <a href="https://github.com/Looplet/meet?ref=meet" rel="noopener">
          GitHub
        </a>
        .
      </footer>
    </>
  );
}
