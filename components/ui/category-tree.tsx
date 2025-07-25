"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { ChevronDown, ChevronRight, Folder, FolderOpen, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Category tree node interface
export interface CategoryTreeNode {
  id: number;
  name: string;
  slug: string;
  description: string;
  count: number;
  image?: {
    id: number;
    src: string;
    name: string;
    alt: string;
  };
  children: CategoryTreeNode[];
  parent: number;
}

interface CategoryTreeProps {
  categories: CategoryTreeNode[];
  onCategorySelect?: (category: CategoryTreeNode) => void;
  selectedCategoryIds?: number[];
  expandedByDefault?: boolean;
  showProductCount?: boolean;
  className?: string;
}

interface CategoryNodeProps {
  category: CategoryTreeNode;
  onCategorySelect?: (category: CategoryTreeNode) => void;
  selectedCategoryIds?: number[];
  showProductCount?: boolean;
  level?: number;
}

function CategoryNode({ 
  category, 
  onCategorySelect, 
  selectedCategoryIds = [], 
  showProductCount = true,
  level = 0 
}: CategoryNodeProps) {
  const [isExpanded, setIsExpanded] = useState(level === 0); // Root categories expanded by default
  const hasChildren = category.children && category.children.length > 0;
  const isSelected = selectedCategoryIds.includes(category.id);
  
  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  const handleSelect = () => {
    onCategorySelect?.(category);
  };

  return (
    <div className="select-none">
      <div
        className={cn(
          "flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer hover:bg-accent/50 transition-colors",
          isSelected && "bg-accent",
          `ml-${level * 4}`
        )}
        style={{ marginLeft: `${level * 16}px` }}
      >
        {/* Expand/Collapse button */}
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={handleToggle}
          disabled={!hasChildren}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )
          ) : (
            <div className="h-3 w-3" />
          )}
        </Button>

        {/* Category icon */}
        <div className="flex-shrink-0">
          {hasChildren ? (
            isExpanded ? (
              <FolderOpen className="h-4 w-4 text-blue-500" />
            ) : (
              <Folder className="h-4 w-4 text-blue-500" />
            )
          ) : (
            <Tag className="h-4 w-4 text-gray-500" />
          )}
        </div>

        {/* Category image (if available) */}
        {category.image && (
          <Image
            src={category.image.src}
            alt={category.image.alt}
            width={24}
            height={24}
            className="rounded object-cover"
          />
        )}

        {/* Category name and details */}
        <div 
          className="flex-1 min-w-0 flex items-center gap-2"
          onClick={handleSelect}
        >
          <span className="font-medium text-sm truncate">
            {category.name}
          </span>
          
          {showProductCount && category.count > 0 && (
            <Badge variant="secondary" className="text-xs">
              {category.count}
            </Badge>
          )}
        </div>
      </div>

             {/* Children */}
       {hasChildren && isExpanded && category.children && (
         <div>
           {category.children.map((child) => (
             <CategoryNode
               key={child.id}
               category={child}
               onCategorySelect={onCategorySelect}
               selectedCategoryIds={selectedCategoryIds}
               showProductCount={showProductCount}
               level={level + 1}
             />
           ))}
         </div>
       )}
    </div>
  );
}

export default function CategoryTree({
  categories,
  onCategorySelect,
  selectedCategoryIds = [],
  showProductCount = true,
  className
}: CategoryTreeProps) {
  if (!categories || categories.length === 0) {
    return (
      <div className={cn("p-4 text-center text-muted-foreground", className)}>
        <Tag className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No categories found</p>
        <p className="text-xs mt-1">
          Make sure your WooCommerce store has categories configured.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-1", className)}>
      {categories.map((category) => (
        <CategoryNode
          key={category.id}
          category={category}
          onCategorySelect={onCategorySelect}
          selectedCategoryIds={selectedCategoryIds}
          showProductCount={showProductCount}
          level={0}
        />
      ))}
    </div>
  );
}

// Utility functions for working with category trees
export const categoryTreeUtils = {
  // Find a category by ID in the tree
  findCategoryById: (categories: CategoryTreeNode[], id: number): CategoryTreeNode | null => {
    if (!categories || !Array.isArray(categories)) {
      return null;
    }
    
    for (const category of categories) {
      if (category.id === id) {
        return category;
      }
      if (category.children && category.children.length > 0) {
        const found = categoryTreeUtils.findCategoryById(category.children, id);
        if (found) return found;
      }
    }
    return null;
  },

  // Get all leaf categories (categories with no children)
  getLeafCategories: (categories: CategoryTreeNode[]): CategoryTreeNode[] => {
    if (!categories || !Array.isArray(categories)) {
      return [];
    }
    
    const leaves: CategoryTreeNode[] = [];
    
    const traverse = (cats: CategoryTreeNode[]) => {
      if (!cats || !Array.isArray(cats)) {
        return;
      }
      
      cats.forEach(cat => {
        if (!cat.children || cat.children.length === 0) {
          leaves.push(cat);
        } else {
          traverse(cat.children);
        }
      });
    };
    
    traverse(categories);
    return leaves;
  },

  // Get category path (breadcrumb) by ID
  getCategoryPath: (categories: CategoryTreeNode[], targetId: number): CategoryTreeNode[] => {
    if (!categories || !Array.isArray(categories)) {
      return [];
    }
    
    const path: CategoryTreeNode[] = [];
    
    const findPath = (cats: CategoryTreeNode[], currentPath: CategoryTreeNode[]): boolean => {
      if (!cats || !Array.isArray(cats)) {
        return false;
      }
      
      for (const cat of cats) {
        const newPath = [...currentPath, cat];
        
        if (cat.id === targetId) {
          path.push(...newPath);
          return true;
        }
        
        if (cat.children && cat.children.length > 0 && findPath(cat.children, newPath)) {
          return true;
        }
      }
      return false;
    };
    
    findPath(categories, []);
    return path;
  },

  // Flatten tree to array
  flattenCategories: (categories: CategoryTreeNode[]): CategoryTreeNode[] => {
    if (!categories || !Array.isArray(categories)) {
      return [];
    }
    
    const flattened: CategoryTreeNode[] = [];
    
    const traverse = (cats: CategoryTreeNode[]) => {
      if (!cats || !Array.isArray(cats)) {
        return;
      }
      
      cats.forEach(cat => {
        flattened.push(cat);
        if (cat.children && cat.children.length > 0) {
          traverse(cat.children);
        }
      });
    };
    
    traverse(categories);
    return flattened;
  }
}; 