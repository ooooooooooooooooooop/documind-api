"use client";

import { useState, useRef, useEffect } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import { Send, Upload, FileText, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress"; // 新增进度条组件

// 定义消息类型
interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
}

interface Source {
  source: string;
  page_content: string;
}

const API_BASE_URL = "/api";

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "你好！我是 DocuMind 文档助手。请先上传 PDF 或 TXT 文档，然后问我相关问题吧！" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0); // 新增：上传进度状态
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [fileList, setFileList] = useState<string[]>([]); // 新增：已上传文件列表
  const [isDragging, setIsDragging] = useState(false); // 新增：拖拽状态
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // 页面加载时获取已有的文档列表
  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/documents`);
      if (response.data && response.data.documents) {
        // 后端返回的是完整路径（如 temp_uploads/xxx.pdf），我们只取文件名
        const filenames = response.data.documents.map((path: string) => 
          path.split('/').pop() || path
        );
        setFileList(filenames);
      }
    } catch (error) {
      console.error("Failed to fetch documents:", error);
    }
  };

  // 自动滚动到底部
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  // 核心上传逻辑
  const processUpload = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0); // 重置进度
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        },
      });
      setUploadedFile(file.name);
      setFileList(prev => [...prev, file.name]); // 上传成功后加入列表
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: `✅ 文件 **${file.name}** 上传成功！已切分为 ${response.data.chunks_created} 个片段，现在可以提问了。` 
      }]);
    } catch (error) {
      console.error("Upload failed:", error);
      setMessages(prev => [...prev, { role: "assistant", content: "❌ 文件上传失败，请检查后端服务是否运行正常。" }]);
    } finally {
      setIsUploading(false);
    }
  };

  // 处理文件输入框上传
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await processUpload(file);
  };

  // 拖拽事件处理
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isUploading) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === e.target) {
        setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (isUploading) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
        const validExts = [".pdf", ".txt", ".docx", ".xlsx", ".md"];
        const lowerName = file.name.toLowerCase();
        if (validExts.some(ext => lowerName.endsWith(ext))) {
            await processUpload(file);
        } else {
            setMessages(prev => [...prev, { role: "assistant", content: "⚠️ 不支持的文件类型。请上传 PDF, TXT, Word, Excel 或 Markdown 文件。" }]);
        }
    }
  };

  // 删除文件
  const handleDeleteFile = async (filename: string) => {
    if (!confirm(`确定要删除文件 "${filename}" 吗？这会清空它相关的向量索引。`)) return;
    
    try {
      await axios.delete(`${API_BASE_URL}/documents`, { params: { filename } });
      setFileList(prev => prev.filter(f => f !== filename));
      if (uploadedFile === filename) setUploadedFile(null);
    } catch (error) {
      console.error("Delete failed:", error);
      alert("删除失败，请查看控制台");
    }
  };

  // 发送消息
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/chat`, { query: userMessage });
      const data = response.data;
      
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: data.answer,
        sources: data.sources 
      }]);
    } catch (error) {
      console.error("Chat failed:", error);
      setMessages(prev => [...prev, { role: "assistant", content: "❌由于网络问题或后端错误，无法获取回答。" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-zinc-900">
      {/* 左侧侧边栏 - 文件管理 */}
      <div className="w-80 border-r bg-white p-6 flex flex-col gap-6 dark:bg-zinc-950 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">DocuMind</h1>
        </div>

        <div className="relative">
          <Card 
            className="p-4 border-dashed border-2 bg-gray-50 dark:bg-zinc-900 dark:border-zinc-700 transition-colors"
            onDragEnter={handleDragEnter}
          >
            <div className="flex flex-col items-center gap-2 text-center">
              <Upload className="h-8 w-8 text-gray-400" />
              <div className="text-sm text-gray-500">
                <label htmlFor="file-upload" className="cursor-pointer text-blue-600 hover:underline font-medium">
                  点击上传
                </label>
                <span className="mx-1">或拖拽文件到这里</span>
                <input 
                  id="file-upload" 
                  type="file" 
                  className="hidden" 
                  accept=".pdf,.txt,.docx,.xlsx,.md"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
              </div>
              <p className="text-xs text-gray-400">支持 PDF, TXT, Word, Excel, Markdown (最大 100MB)</p>
            </div>
            
            {isDragging && (
              <div 
                className="absolute inset-0 bg-blue-50/90 dark:bg-blue-900/50 z-50 flex items-center justify-center border-2 border-blue-500 border-dashed rounded-lg"
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <div className="flex flex-col items-center gap-2 text-blue-600 dark:text-blue-400 pointer-events-none">
                  <Upload className="h-10 w-10 animate-bounce" />
                  <p className="font-medium text-lg">释放以上传文件</p>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* 文件列表区域 */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-2">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">已上传文件 ({fileList.length})</div>
          
          {fileList.length === 0 && (
            <div className="text-sm text-gray-400 text-center py-4">暂无文件</div>
          )}

          {fileList.map((filename, idx) => (
            <div key={idx} className="group flex items-center justify-between p-3 bg-white border rounded-lg text-sm hover:bg-gray-50 transition-colors dark:bg-zinc-900 dark:border-zinc-700">
              <div className="flex items-center gap-2 truncate flex-1">
                <FileText className="h-4 w-4 shrink-0 text-blue-500" />
                <span className="truncate text-gray-700 dark:text-gray-300" title={filename}>{filename}</span>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleDeleteFile(filename)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}

          {isUploading && (
            <div className="flex flex-col gap-2 p-3 bg-blue-50 text-blue-700 rounded-lg text-sm animate-pulse">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>
                  {uploadProgress === 100 
                    ? "上传完成，正在解析文档，请稍候..." 
                    : `正在上传... ${uploadProgress}%`}
                </span>
              </div>
              <Progress value={uploadProgress} className="h-2 w-full bg-blue-200" />
            </div>
          )}
        </div>
        
        <div className="mt-auto text-xs text-gray-400 text-center pt-4 border-t dark:border-zinc-800">
          Powered by FastAPI & LangChain
        </div>
      </div>

      {/* 右侧主区域 - 聊天界面 */}
      <div className="flex-1 flex flex-col h-full max-w-4xl mx-auto w-full">
        {/* 聊天记录区域 */}
        <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
          <div className="flex flex-col gap-6 pb-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                <Avatar className="h-10 w-10 border">
                  <AvatarFallback>{msg.role === "user" ? "ME" : "AI"}</AvatarFallback>
                  <AvatarImage src={msg.role === "user" ? "/user-avatar.png" : "/ai-avatar.png"} />
                </Avatar>
                
                <div className={`flex flex-col gap-2 max-w-[80%]`}>
                  <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                    msg.role === "user" 
                      ? "bg-blue-600 text-white" 
                      : "bg-white border shadow-sm dark:bg-zinc-800 dark:border-zinc-700 dark:text-gray-100"
                  }`}>
                    <div className="prose dark:prose-invert max-w-none text-sm break-words">
                        <ReactMarkdown>
                            {msg.content}
                        </ReactMarkdown>
                    </div>
                  </div>

                  {/* 显示引用来源 */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-1 flex flex-col gap-2">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Sources</span>
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {msg.sources.map((src, i) => (
                          <Card key={i} className="p-3 bg-gray-50 border min-w-[200px] max-w-[240px] text-xs cursor-pointer hover:bg-gray-100 transition-colors dark:bg-zinc-900 dark:border-zinc-700">
                            <div className="font-semibold text-gray-700 mb-1 truncate dark:text-gray-300">{src.source}</div>
                            <div className="text-gray-500 line-clamp-3 dark:text-gray-400">{src.page_content}</div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-4">
                <Avatar className="h-10 w-10 border">
                  <AvatarFallback>AI</AvatarFallback>
                </Avatar>
                <div className="p-4 rounded-2xl bg-gray-100 dark:bg-zinc-800">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* 底部输入框 */}
        <div className="p-4 bg-white border-t dark:bg-zinc-950 dark:border-zinc-800">
          <div className="relative max-w-4xl mx-auto flex gap-2">
            <Input 
              placeholder="问关于文档的问题..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
              className="flex-1 pr-12 py-6 text-base shadow-sm bg-gray-50 border-gray-200 focus-visible:ring-blue-500 dark:bg-zinc-900 dark:border-zinc-700"
              disabled={isLoading}
            />
            <Button 
              size="icon" 
              className="absolute right-2 top-2 h-10 w-10 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-all disabled:opacity-50"
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </Button>
          </div>
          <div className="text-center mt-2 text-xs text-gray-400">
            DocuMind 可以回答关于上传文档的任何问题。生成内容仅供参考。
          </div>
        </div>
      </div>
    </div>
  );
}
