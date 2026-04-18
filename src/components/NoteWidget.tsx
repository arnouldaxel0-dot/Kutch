import { useState, useRef, useEffect } from 'react'
import { X, GripVertical } from 'lucide-react'
import type { Note } from '../types'

interface NoteWidgetProps {
  note: Note
  scale: number
  onUpdate: (id: string, updates: Partial<Note>) => void
  onDelete: (id: string) => void
}

const NOTE_COLORS = ['#fef08a', '#bbf7d0', '#bfdbfe', '#fecaca', '#e9d5ff', '#fed7aa']

export default function NoteWidget({ note, scale, onUpdate, onDelete }: NoteWidgetProps) {
  const [editing, setEditing] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const textRef = useRef<HTMLTextAreaElement>(null)
  const isDragging = useRef(false)
  const isResizing = useRef(false)
  const dragStart = useRef({ mouseX: 0, mouseY: 0, noteX: 0, noteY: 0 })
  const resizeStart = useRef({ mouseX: 0, mouseY: 0, w: 0, h: 0 })

  useEffect(() => {
    if (editing) textRef.current?.focus()
  }, [editing])

  const startDrag = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    isDragging.current = true
    dragStart.current = { mouseX: e.clientX, mouseY: e.clientY, noteX: note.x, noteY: note.y }
    const onMove = (ev: MouseEvent) => {
      if (!isDragging.current) return
      const dx = (ev.clientX - dragStart.current.mouseX) / scale
      const dy = (ev.clientY - dragStart.current.mouseY) / scale
      onUpdate(note.id, { x: dragStart.current.noteX + dx, y: dragStart.current.noteY + dy })
    }
    const onUp = () => { isDragging.current = false; document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp) }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  const startResize = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    isResizing.current = true
    resizeStart.current = { mouseX: e.clientX, mouseY: e.clientY, w: note.width, h: note.height }
    const onMove = (ev: MouseEvent) => {
      if (!isResizing.current) return
      const dw = (ev.clientX - resizeStart.current.mouseX) / scale
      const dh = (ev.clientY - resizeStart.current.mouseY) / scale
      onUpdate(note.id, {
        width: Math.max(80, resizeStart.current.w + dw),
        height: Math.max(60, resizeStart.current.h + dh),
      })
    }
    const onUp = () => { isResizing.current = false; document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp) }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  return (
    <div
      style={{
        position: 'absolute',
        left: note.x,
        top: note.y,
        width: note.width,
        height: note.height,
        backgroundColor: note.color,
        borderRadius: 6,
        boxShadow: '2px 4px 12px rgba(0,0,0,0.25)',
        display: 'flex',
        flexDirection: 'column',
        userSelect: editing ? 'text' : 'none',
        pointerEvents: 'all',
        zIndex: 20,
      }}
      onMouseDown={e => e.stopPropagation()}
    >
      {/* Header drag zone */}
      <div
        style={{ display: 'flex', alignItems: 'center', padding: '3px 4px', cursor: 'move', borderBottom: '1px solid rgba(0,0,0,0.1)', gap: 2 }}
        onMouseDown={startDrag}
      >
        <GripVertical size={10} style={{ color: 'rgba(0,0,0,0.4)', flexShrink: 0 }} />
        <div style={{ flex: 1 }} />
        {/* Color picker */}
        <div style={{ position: 'relative' }}>
          <button
            onMouseDown={e => { e.stopPropagation(); setShowColorPicker(v => !v) }}
            style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: note.color, border: '1.5px solid rgba(0,0,0,0.3)', cursor: 'pointer' }}
          />
          {showColorPicker && (
            <div style={{ position: 'absolute', top: 16, right: 0, background: '#1e293b', border: '1px solid #475569', borderRadius: 6, padding: 4, display: 'flex', gap: 3, zIndex: 30 }}
              onMouseDown={e => e.stopPropagation()}>
              {NOTE_COLORS.map(c => (
                <button key={c} onMouseDown={e => { e.stopPropagation(); onUpdate(note.id, { color: c }); setShowColorPicker(false) }}
                  style={{ width: 16, height: 16, borderRadius: '50%', backgroundColor: c, border: c === note.color ? '2px solid #6366f1' : '1px solid rgba(0,0,0,0.2)', cursor: 'pointer' }} />
              ))}
            </div>
          )}
        </div>
        <button
          onMouseDown={e => { e.stopPropagation(); onDelete(note.id) }}
          style={{ color: 'rgba(0,0,0,0.4)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
        ><X size={11} /></button>
      </div>

      {/* Text area */}
      {editing ? (
        <textarea
          ref={textRef}
          value={note.text}
          onChange={e => onUpdate(note.id, { text: e.target.value })}
          onBlur={() => setEditing(false)}
          style={{ flex: 1, resize: 'none', border: 'none', background: 'transparent', padding: '4px 6px', fontSize: 11, lineHeight: 1.4, outline: 'none', color: 'rgba(0,0,0,0.8)' }}
        />
      ) : (
        <div
          onDoubleClick={() => setEditing(true)}
          style={{ flex: 1, padding: '4px 6px', fontSize: 11, lineHeight: 1.4, color: 'rgba(0,0,0,0.8)', whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflow: 'hidden', cursor: 'text' }}
        >
          {note.text || <span style={{ color: 'rgba(0,0,0,0.3)', fontStyle: 'italic' }}>Double-clic pour éditer…</span>}
        </div>
      )}

      {/* Resize handle */}
      <div
        onMouseDown={startResize}
        style={{ position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, cursor: 'se-resize', borderTop: '2px solid rgba(0,0,0,0.2)', borderLeft: '2px solid rgba(0,0,0,0.2)', borderBottomRightRadius: 4 }}
      />
    </div>
  )
}
