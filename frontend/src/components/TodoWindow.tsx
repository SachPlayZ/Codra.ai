import React from "react";
import { Check } from "lucide-react";

interface TodoWindowProps {
  completedTasksCount?: number;
}

const TodoWindow: React.FC<TodoWindowProps> = ({ completedTasksCount = 0 }) => {
  const tasks = [
    "Set up development environment",
    "Design user interface mockups",
    "Implement authentication system",
    "Build core features",
    "Add real-time collaboration",
    "Deploy to production",
  ];

  return (
    <div className="w-full max-w-md relative z-10">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-300 dark:border-gray-700 overflow-hidden">
        {/* macOS-style window chrome */}
        <div className="window-header bg-gray-100 dark:bg-gray-800 px-4 py-2.5 flex items-center border-b border-gray-300 dark:border-gray-700 cursor-move">
          <div className="flex space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full hover:bg-red-400 transition-colors"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full hover:bg-yellow-400 transition-colors"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full hover:bg-green-400 transition-colors"></div>
          </div>
          <div className="flex-1 text-center">
            <span className="text-gray-600 dark:text-gray-400 text-xs font-mono">
              Project Tasks
            </span>
          </div>
        </div>

        {/* Todo list content */}
        <div className="bg-white dark:bg-gray-900 p-4 min-h-[300px]">
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-900 dark:text-white font-semibold text-sm">
                Hackathon Tasks
              </h3>
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {completedTasksCount}/{tasks.length} completed
              </span>
            </div>

            {tasks.map((task, index) => {
              const isCompleted = index < completedTasksCount;
              const isAnimating =
                index === completedTasksCount &&
                completedTasksCount < tasks.length;

              return (
                <div
                  key={index}
                  className={`flex items-center space-x-3 p-2 rounded-lg transition-all duration-500 ${
                    isCompleted
                      ? "bg-emerald-100/60 dark:bg-emerald-900/30 border border-emerald-400/50 dark:border-emerald-700/50"
                      : isAnimating
                      ? "bg-blue-100/60 dark:bg-blue-900/30 border border-blue-400/50 dark:border-blue-700/50"
                      : "bg-gray-100/60 dark:bg-gray-800/50 border border-gray-300/50 dark:border-gray-700/50"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-300 ${
                      isCompleted
                        ? "bg-emerald-500 border-emerald-500"
                        : "border-gray-400 dark:border-gray-600"
                    }`}
                  >
                    {isCompleted && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span
                    className={`text-sm transition-all duration-300 ${
                      isCompleted
                        ? "text-gray-500 dark:text-gray-400 line-through"
                        : "text-gray-800 dark:text-gray-200"
                    }`}
                  >
                    {task}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Progress bar */}
          <div className="mt-6 pt-4 border-t border-gray-300 dark:border-gray-700">
            <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-2">
              <span>Progress</span>
              <span>
                {Math.round((completedTasksCount / tasks.length) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-300 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-500 ease-out ${
                  completedTasksCount === tasks.length
                    ? "bg-green-500"
                    : "bg-gray-500 dark:bg-gray-400"
                }`}
                style={{
                  width: `${(completedTasksCount / tasks.length) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TodoWindow;
