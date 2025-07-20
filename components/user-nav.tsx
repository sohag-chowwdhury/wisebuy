"use client";

import { User, MoreHorizontal } from "lucide-react";

export function UserNav() {
  return (
    <div className="flex items-center justify-between p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full cursor-pointer transition-colors">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
          <User className="h-5 w-5" />
        </div>
        <div className="lg:hidden xl:block">
          <div className="text-sm font-semibold">John Doe</div>
          <div className="text-sm text-gray-500">@johndoe</div>
        </div>
      </div>
      <MoreHorizontal className="h-5 w-5 lg:hidden xl:block" />
    </div>
  );
}
