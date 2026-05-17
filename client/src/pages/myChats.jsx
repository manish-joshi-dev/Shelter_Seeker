import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { io } from 'socket.io-client'

function MyChats() {
  const { curUser } = useSelector((s) => s.user)
  const location = useLocation()
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [histories, setHistories] = useState({}) // key: conversationId -> messages[]
  const [activeCid, setActiveCid] = useState(null)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [typingUsers, setTypingUsers] = useState({}) // conversationId -> userId -> isTyping

  const socketRef = useRef(null);

  const activeConversation = useMemo(() => items.find((c) => c.conversationId === activeCid) || null, [items, activeCid])

  // WebSocket connection setup
  useEffect(() => {
    if (!curUser) return

    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3001', {
      withCredentials: true,
      query: { userId: curUser._id },
    })
    socketRef.current = socket

    socket.on('connect', () => {
      // Join all conversations when connected
      items.forEach((item) => {
        socket.emit('join_conversation', { conversationId: item.conversationId })
      })
    })

    // Also join conversations when items change (in case socket connected before items loaded)
    if (items.length > 0) {
      items.forEach((item) => {
        socket.emit('join_conversation', { conversationId: item.conversationId })
      })
    }

    socket.on('chat_message', (msg) => {
      console.log('Received WebSocket message:', msg) // Debug log
      // Update the specific conversation's history
      setHistories((prev) => {
        const next = { ...prev }
        const conversationId = msg.conversationId
        if (!next[conversationId]) {
          next[conversationId] = []
        }
        // Add the new message to the conversation
        next[conversationId] = [...next[conversationId], {
          senderId: msg.senderId,
          senderName: msg.senderName,
          text: msg.text,
          createdAt: new Date(msg.serverTimestamp || Date.now()).toISOString(),
        }]
        return next
      })

      // Update the conversation list to show the latest message
      setItems((prev) => {
        return prev.map((item) => {
          if (item.conversationId === msg.conversationId) {
            return {
              ...item,
              lastMessage: {
                senderName: msg.senderName,
                text: msg.text,
              },
            }
          }
          return item
        })
      })
    })

    socket.on('typing', ({ conversationId, userId, isTyping }) => {
      if (userId === curUser._id) return // Don't show our own typing
      
      setTypingUsers((prev) => {
        const next = { ...prev }
        if (!next[conversationId]) {
          next[conversationId] = {}
        }
        if (isTyping) {
          next[conversationId][userId] = true
        } else {
          delete next[conversationId][userId]
        }
        return next
      })
    })

    return () => {
      socket.disconnect()
    }
  }, [curUser, items])

  const send = async () => {
    const text = draft.trim()
    if (!text || !activeConversation || sending) return
    try {
      setSending(true)
      
      // Send via WebSocket for real-time delivery
      if (socketRef.current) {
        const message = {
          senderId: curUser._id,
          senderName: curUser.username,
          text,
        }
        console.log('Sending WebSocket message:', { conversationId: activeCid, message }) // Debug log
        socketRef.current.emit('chat_message', {
          conversationId: activeCid,
          listingId: activeConversation.listingId,
          landlordId: activeConversation.landlordId,
          tenantId: activeConversation.tenantId,
          message,
        })
      }

      // Also send via HTTP for persistence (backup)
      const body = {
        listingId: activeConversation.listingId,
        landlordId: activeConversation.landlordId,
        tenantId: activeConversation.tenantId,
        message: {
          senderId: curUser._id,
          senderName: curUser.username,
          text,
        },
      }
      const res = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      })
      const data = await res.json()
      
      // Don't update local state here - let WebSocket handle it to avoid duplicates
      
      setDraft('')
    } catch (_) {
      // swallow
    } finally {
      setSending(false)
    }
  }

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/chat/my', { credentials: 'include' })
        const data = await res.json()
        if (!mounted) return
        if (Array.isArray(data)) {
          setItems(data)
        } else {
          setError('Failed to load chats')
        }
      } catch (e) {
        if (mounted) setError('Failed to load chats')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    if (curUser) load()
    return () => {
      mounted = false
    }
  }, [curUser])

  // Load all conversation histories (we'll show selected on the right)
  useEffect(() => {
    let cancelled = false
    const loadAllHistories = async () => {
      try {
        if (!items || items.length === 0) return
        const requests = items.map((c) => {
          const params = new URLSearchParams()
          params.set('landlordId', c.landlordId)
          params.set('tenantId', c.tenantId)
          if (c.listingId) params.set('listingId', c.listingId)
          return fetch(`/api/chat/conversation?${params.toString()}`, { credentials: 'include' })
            .then((r) => r.json())
            .then((data) => ({ cid: c.conversationId, data }))
            .catch(() => ({ cid: c.conversationId, data: null }))
        })
        const results = await Promise.all(requests)
        if (cancelled) return
        const next = {}
        results.forEach(({ cid, data }) => {
          if (data && Array.isArray(data.messages)) {
            next[cid] = data.messages
          } else {
            next[cid] = []
          }
        })
        setHistories(next)
        // Set default active conversation (from query or first)
        const params = new URLSearchParams(location.search)
        const openUser = params.get('openUser')
        if (openUser) {
          const match = items.find((c) => c.otherUserId === openUser || c.landlordId === openUser || c.tenantId === openUser)
          if (match) setActiveCid(match.conversationId)
          // clean query param
          params.delete('openUser')
          navigate({ pathname: location.pathname, search: params.toString() }, { replace: true })
        } else if (!activeCid && items.length > 0) {
          setActiveCid(items[0].conversationId)
        }
      } catch (_) {}
    }
    loadAllHistories()
    return () => {
      cancelled = true
    }
  }, [items])

  if (!curUser) return <div className='max-w-5xl mx-auto p-4'>Please sign in to view chats.</div>

  return (
    <div className='max-w-6xl mx-auto p-4'>
      <h1 className='text-2xl font-semibold mb-4'>My Chats</h1>
      {loading && <div>Loading…</div>}
      {error && <div className='text-red-600'>{error}</div>}
      {!loading && !error && (
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <aside className='md:col-span-1 border rounded-lg bg-white divide-y'>
            {items.length === 0 && <div className='p-4 text-neutral-600'>No conversations yet.</div>}
            {items.map((c) => {
              const isActive = c.conversationId === activeCid
              return (
                <button
                  key={c.id}
                  onClick={() => setActiveCid(c.conversationId)}
                  className={`w-full flex items-center gap-3 p-3 text-left hover:bg-neutral-50 ${isActive ? 'bg-neutral-50' : ''}`}
                >
                  <img src={c.otherAvatar || 'https://via.placeholder.com/40'} alt='' className='w-10 h-10 rounded-full border' />
                  <div className='flex-1'>
                    <div className='font-medium'>{c.otherUsername}</div>
                    {c.lastMessage && (
                      <div className='text-xs text-neutral-600 truncate'>
                        {c.lastMessage.senderName ? `${c.lastMessage.senderName}: ` : ''}
                        {c.lastMessage.text}
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </aside>
          <section className='md:col-span-2 border rounded-lg bg-white flex flex-col'>
            {!activeCid && <div className='p-6 text-neutral-600'>Select a conversation to view messages.</div>}
            {activeCid && (
              <div className='flex-1 flex flex-col'>
                <div className='p-4 border-b'>
                  <div className='font-medium'>
                    {items.find((c) => c.conversationId === activeCid)?.otherUsername || 'Chat'}
                  </div>
                </div>
                <div className='p-4 bg-neutral-50 flex-1 overflow-y-auto space-y-2'>
                  {(histories[activeCid] || []).length === 0 && (
                    <div className='text-sm text-neutral-500'>No messages yet.</div>
                  )}
                  {(histories[activeCid] || []).map((m, idx) => {
                    const mine = String(m.senderId) === String(curUser?._id)
                    return (
                      <div key={`${activeCid}_${idx}`} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`${mine ? 'bg-blue-600 text-white' : 'bg-white text-neutral-900'} px-3 py-2 rounded-lg max-w-[75%] shadow`}>
                          {m.text}
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className='p-3 border-t flex gap-2'>
                  <input
                    value={draft}
                    onChange={(e) => {
                      setDraft(e.target.value)
                      // Send typing indicator
                      if (socketRef.current && activeCid) {
                        socketRef.current.emit('typing', { 
                          conversationId: activeCid, 
                          userId: curUser._id, 
                          isTyping: e.target.value.trim().length > 0 
                        })
                      }
                    }}
                    onBlur={() => {
                      // Stop typing indicator when input loses focus
                      if (socketRef.current && activeCid) {
                        socketRef.current.emit('typing', { 
                          conversationId: activeCid, 
                          userId: curUser._id, 
                          isTyping: false 
                        })
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        send()
                        // Stop typing indicator when message is sent
                        if (socketRef.current && activeCid) {
                          socketRef.current.emit('typing', { 
                            conversationId: activeCid, 
                            userId: curUser._id, 
                            isTyping: false 
                          })
                        }
                      }
                    }}
                    disabled={sending}
                    placeholder={Object.keys(typingUsers[activeCid] || {}).length > 0 ? 'Someone is typing...' : 'Type a message'}
                    className='flex-1 border rounded-lg px-3 py-2'
                  />
                  <button onClick={() => send()} disabled={sending || !draft.trim()} className='bg-slate-900 text-white px-4 py-2 rounded-lg disabled:opacity-50'>
                    Send
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}

export default MyChats


