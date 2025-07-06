"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  LinkIcon,
  ImageIcon,
  Palette,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  height?: string
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Start typing...",
  height = "300px",
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [isEditorFocused, setIsEditorFocused] = useState(false)

  // Initialize editor content
  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value
    }
  }, [value])

  // Handle content changes
  const handleInput = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML
      onChange(content)
    }
  }

  // Execute formatting commands
  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
    handleInput()
  }

  // Insert link
  const insertLink = () => {
    const url = prompt("Enter URL:")
    if (url) {
      execCommand("createLink", url)
    }
  }

  // Insert image
  const insertImage = () => {
    const url = prompt("Enter image URL:")
    if (url) {
      execCommand("insertImage", url)
    }
  }

  // Change font size
  const changeFontSize = (size: string) => {
    execCommand("fontSize", size)
  }

  // Change text color
  const changeTextColor = (color: string) => {
    execCommand("foreColor", color)
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="bg-gray-50 border-b p-2 flex flex-wrap items-center gap-1">
        {/* Font Size */}
        <Select onValueChange={changeFontSize}>
          <SelectTrigger className="w-20 h-8">
            <SelectValue placeholder="Size" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Small</SelectItem>
            <SelectItem value="3">Normal</SelectItem>
            <SelectItem value="5">Large</SelectItem>
            <SelectItem value="7">Huge</SelectItem>
          </SelectContent>
        </Select>

        <Separator orientation="vertical" className="h-6" />

        {/* Basic Formatting */}
        <Button variant="ghost" size="sm" onClick={() => execCommand("bold")} className="h-8 w-8 p-0">
          <Bold className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => execCommand("italic")} className="h-8 w-8 p-0">
          <Italic className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => execCommand("underline")} className="h-8 w-8 p-0">
          <Underline className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6" />

        {/* Text Color */}
        <div className="flex items-center gap-1">
          <Palette className="h-4 w-4 text-gray-500" />
          <input
            type="color"
            onChange={(e) => changeTextColor(e.target.value)}
            className="w-8 h-8 border rounded cursor-pointer"
            title="Text Color"
          />
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Alignment */}
        <Button variant="ghost" size="sm" onClick={() => execCommand("justifyLeft")} className="h-8 w-8 p-0">
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => execCommand("justifyCenter")} className="h-8 w-8 p-0">
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => execCommand("justifyRight")} className="h-8 w-8 p-0">
          <AlignRight className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6" />

        {/* Lists */}
        <Button variant="ghost" size="sm" onClick={() => execCommand("insertUnorderedList")} className="h-8 w-8 p-0">
          <List className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => execCommand("insertOrderedList")} className="h-8 w-8 p-0">
          <ListOrdered className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6" />

        {/* Links & Images */}
        <Button variant="ghost" size="sm" onClick={insertLink} className="h-8 w-8 p-0">
          <LinkIcon className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={insertImage} className="h-8 w-8 p-0">
          <ImageIcon className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onFocus={() => setIsEditorFocused(true)}
        onBlur={() => setIsEditorFocused(false)}
        className={`p-4 min-h-[${height}] outline-none prose prose-sm max-w-none`}
        style={{ minHeight: height }}
        data-placeholder={placeholder}
        suppressContentEditableWarning={true}
      />

      {/* Character Count */}
      <div className="bg-gray-50 border-t px-4 py-2 text-sm text-gray-500">
        Characters: {value.replace(/<[^>]*>/g, "").length}
      </div>
    </div>
  )
}
