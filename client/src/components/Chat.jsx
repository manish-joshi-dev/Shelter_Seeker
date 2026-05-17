import React, { useEffect, useMemo, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { useSelector } from 'react-redux'

function Chat({ listing }) {
  const { curUser } = useSelector((state) => state.user)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  // conversation unique per landlord-tenant pair (listing is metadata only)
  const conversationId = useMemo(() => `pair_${listing?.userRef}_${curUser?._id}`, [listing, curUser])

  const socketRef = useRef(null)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (!curUser) return
    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3001', {
      withCredentials: true,
      query: { userId: curUser._id },
    })
    socketRef.current = socket

    socket.on('connect', () => {
      socket.emit('join_conversation', { conversationId })
    })

    socket.on('joined_conversation', () => {})

    socket.on('chat_message', (msg) => {
      if (msg.conversationId !== conversationId) return
      setMessages((prev) => [...prev, msg])
    })

    socket.on('typing', ({ conversationId: cid, userId, isTyping: typing }) => {
      if (cid !== conversationId || userId === curUser._id) return
      setIsTyping(!!typing)
    })

    return () => {
      socket.disconnect()
    }
  }, [conversationId, curUser])

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  useEffect(() => {
    const loadHistory = async () => {
      try {
        if (!curUser) return
        const res = await fetch(`/api/chat/conversation?landlordId=${listing.userRef}&tenantId=${curUser._id}${listing?._id ? `&listingId=${listing._id}` : ''}`, {
          credentials: 'include'
        })
        const data = await res.json()
        if (data && Array.isArray(data.messages)) {
          setMessages(
            data.messages.map((m, idx) => ({
              id: `${idx}_${m.createdAt}`,
              text: m.text,
              senderId: m.senderId,
              senderName: m.senderName,
              createdAt: new Date(m.createdAt).getTime(),
              conversationId,
            }))
          )
        }
      } catch (e) {
        // ignore history load errors
      }
    }
    loadHistory()
  }, [listing, curUser, conversationId])

  const sendMessage = () => {
    const text = input.trim()
    if (!text || !socketRef.current) return
    const message = {
      id: `${Date.now()}_${curUser._id}`,
      text,
      senderId: curUser._id,
      senderName: curUser.username,
      createdAt: Date.now(),
    }
    socketRef.current.emit('chat_message', { conversationId, listingId: listing?._id, landlordId: listing.userRef, tenantId: curUser._id, message })
    // Don't add optimistic update - let WebSocket handle it to avoid duplicates
    setInput('')
  }

  let placeholder = 'Type a message'
  if (isTyping) placeholder = 'Landlord is typing…'

  return (
    <div className='w-full border rounded-lg flex flex-col h-96'>
      <div className='px-4 py-3 border-b font-semibold'>
        Chat with landlord
      </div>
      <div className='flex-1 overflow-y-auto p-3 space-y-2 bg-neutral-50'>
        {messages.map((m) => {
          const mine = m.senderId === curUser?._id
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`${mine ? 'bg-blue-600 text-white' : 'bg-white text-neutral-900'} px-3 py-2 rounded-lg max-w-[75%] shadow`}>{m.text}</div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>
      <div className='p-3 border-t flex gap-2'>
        <input
          value={input}
          onChange={(e) => {
            setInput(e.target.value)
            if (socketRef.current) {
              socketRef.current.emit('typing', { conversationId, userId: curUser?._id, isTyping: true })
            }
          }}
          onBlur={() => socketRef.current?.emit('typing', { conversationId, userId: curUser?._id, isTyping: false })}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              sendMessage()
              socketRef.current?.emit('typing', { conversationId, userId: curUser?._id, isTyping: false })
            }
          }}
          className='flex-1 border rounded-lg px-3 py-2'
          placeholder={placeholder}
        />
        <button onClick={sendMessage} className='bg-slate-900 text-white px-4 py-2 rounded-lg'>Send</button>
      </div>
    </div>
  )
}

export default Chat


