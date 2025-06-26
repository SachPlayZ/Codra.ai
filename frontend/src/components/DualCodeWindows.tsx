import React, { useState, useEffect, useRef } from "react";
import TodoWindow from "./TodoWindow";

interface WindowPosition {
  x: number;
  y: number;
}

const DualCodeWindows: React.FC = () => {
  const [showCursor, setShowCursor] = useState(true);
  const [userCode, setUserCode] = useState("");
  const [codeEditorPos, setCodeEditorPos] = useState<WindowPosition>({
    x: 1250,
    y: 80,
  });
  const [todoPos, setTodoPos] = useState<WindowPosition>({ x: 1100, y: 300 });
  const [isDragging, setIsDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<WindowPosition>({ x: 0, y: 0 });
  const [completedTasks, setCompletedTasks] = useState(0);

  const codeEditorRef = useRef<HTMLDivElement>(null);
  const todoRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const placeholderCode = `// Start typing your React component here...
// Each new line will complete a task!

import React, { useState } from 'react';

function YourComponent() {
  
}`;

  useEffect(() => {
    const interval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 500);

    return () => clearInterval(interval);
  }, []);

  // Count newlines and update completed tasks
  useEffect(() => {
    const newlineCount = (userCode.match(/\n/g) || []).length;
    setCompletedTasks(Math.min(newlineCount, 6)); // Max 6 tasks
  }, [userCode]);

  const handleMouseDown = (e: React.MouseEvent, windowType: string) => {
    // Check if we're clicking on the window header or the window itself
    const target = e.target as HTMLElement;
    const isHeader =
      target.classList.contains("window-header") ||
      target.closest(".window-header");
    const isWindow = target.closest(".draggable-window");

    if (isHeader || (isWindow && !target.closest("textarea"))) {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(windowType);

      const rect = e.currentTarget.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const newX = e.clientX - containerRect.left - dragOffset.x;
    const newY = e.clientY - containerRect.top - dragOffset.y;

    // Full hero section boundary constraints
    const windowWidth = 400; // Approximate window width
    const windowHeight = 380; // Approximate window height including header
    const maxX = containerRect.width - windowWidth;
    const maxY = containerRect.height - windowHeight;

    const constrainedX = Math.max(0, Math.min(newX, maxX));
    const constrainedY = Math.max(0, Math.min(newY, maxY));

    if (isDragging === "code-editor") {
      setCodeEditorPos({ x: constrainedX, y: constrainedY });
    } else if (isDragging === "todo") {
      setTodoPos({ x: constrainedX, y: constrainedY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(null);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  // Determine what to display
  const isShowingPlaceholder = !userCode;
  const displayCode = userCode || placeholderCode;
  const lines = displayCode.split("\n");

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[calc(100vh-4rem)] overflow-hidden"
    >
      {/* Background Code Editor Window - Draggable */}
      <div
        ref={codeEditorRef}
        className="draggable-window absolute w-96 z-30 cursor-move transition-all duration-200 hover:shadow-2xl hover:z-40"
        style={{
          left: `${codeEditorPos.x}px`,
          top: `${codeEditorPos.y}px`,
          transform:
            isDragging === "code-editor"
              ? "rotate(2deg) scale(1.02)"
              : "rotate(6deg)",
        }}
        onMouseDown={(e) => handleMouseDown(e, "code-editor")}
      >
        <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-xl shadow-2xl border border-gray-300 dark:border-gray-700 overflow-hidden">
          {/* macOS-style window chrome */}
          <div className="window-header bg-gray-100/95 dark:bg-gray-800/95 backdrop-blur-sm px-4 py-2.5 flex items-center border-b border-gray-300 dark:border-gray-700 cursor-move">
            <div className="flex space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full hover:bg-red-400 transition-colors"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full hover:bg-yellow-400 transition-colors"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full hover:bg-green-400 transition-colors"></div>
            </div>
            <div className="flex-1 text-center">
              <span className="text-gray-600 dark:text-gray-400 text-xs font-mono">
                YourComponent.tsx
              </span>
            </div>
          </div>

          {/* Code editor content with user input */}
          <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm relative h-80">
            {/* Code display - plain text */}
            <div className="absolute left-4 top-3 right-3 text-xs font-mono leading-5 pointer-events-none z-10">
              {lines.map((line, index) => (
                <div key={index}>
                  <span
                    className={
                      isShowingPlaceholder
                        ? "text-gray-400 dark:text-gray-500"
                        : "text-gray-800 dark:text-gray-100"
                    }
                  >
                    {line}
                  </span>
                </div>
              ))}
            </div>

            {/* Invisible textarea for user input */}
            <textarea
              ref={textareaRef}
              value={userCode}
              onChange={(e) => setUserCode(e.target.value)}
              className="absolute inset-0 w-full h-full bg-transparent text-transparent resize-none outline-none pl-4 pt-3 pr-3 text-xs font-mono leading-5 z-20"
              placeholder=""
              spellCheck={false}
              style={{ caretColor: showCursor ? "gray" : "transparent" }}
              onMouseDown={(e) => e.stopPropagation()}
            />

            {/* Blinking cursor indicator (only show when placeholder is visible) */}
            {isShowingPlaceholder && (
              <div
                className={`absolute left-4 top-3 w-0.5 h-5 bg-gray-800 dark:bg-white ${
                  showCursor ? "opacity-100" : "opacity-0"
                } transition-opacity duration-100 pointer-events-none`}
                style={{ filter: "drop-shadow(0 0 4px rgba(0, 0, 0, 0.3))" }}
              />
            )}
          </div>

          {/* Status bar */}
          <div className="bg-gray-100/95 dark:bg-gray-800/95 backdrop-blur-sm px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 border-t border-gray-300 dark:border-gray-700 flex justify-between pointer-events-none">
            <span>TypeScript React</span>
            <span>
              Lines: {lines.length} | Tasks: {completedTasks}/6
            </span>
          </div>
        </div>
      </div>

      {/* Foreground Todo Window - Draggable */}
      <div
        ref={todoRef}
        className="draggable-window absolute w-80 z-30 cursor-move transition-all duration-200 hover:shadow-2xl hover:z-40"
        style={{
          left: `${todoPos.x}px`,
          top: `${todoPos.y}px`,
          transform:
            isDragging === "todo"
              ? "rotate(0deg) scale(1.02)"
              : "rotate(-3deg)",
        }}
        onMouseDown={(e) => handleMouseDown(e, "todo")}
      >
        <div className="bg-gray-900/95 backdrop-blur-sm rounded-xl shadow-2xl border border-gray-700 overflow-hidden">
          <TodoWindow completedTasksCount={completedTasks} />
        </div>
      </div>

      {/* Instruction text */}
      <div className="absolute bottom-4 right-4 text-gray-400 text-sm bg-black/70 backdrop-blur-sm px-4 py-3 rounded-lg border border-gray-700/50 z-20 pointer-events-none">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">🎮</span>
          <div>
            <div className="text-white font-medium">
              Full Hero Section Playground!
            </div>
            <div className="text-xs text-gray-300">
              Drag windows anywhere • Type code to complete tasks
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DualCodeWindows;
