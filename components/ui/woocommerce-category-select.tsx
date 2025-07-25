"use client";

import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search, Check, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

// Category interface matching the WooCommerce API structure
interface WooCommerceCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  count: number;
  parent: number;
  children: WooCommerceCategory[];
}

interface WooCommerceCategorySelectProps {
  value: string;
  onChange: (value: string, categoryId?: number) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  disabled?: boolean;
  label?: string;
}

export function WooCommerceCategorySelect({
  value,
  onChange,
  placeholder = "Select or enter category",
  className,
  id,
  disabled = false,
  label
}: WooCommerceCategorySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [categories, setCategories] = useState<WooCommerceCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCategories, setFilteredCategories] = useState<WooCommerceCategory[]>([]);
  const [isCustomInput, setIsCustomInput] = useState(false);
  const [customValue, setCustomValue] = useState('');
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsCustomInput(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter categories based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredCategories(flattenCategories(categories));
      return;
    }

    const filtered = flattenCategories(categories).filter(category =>
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCategories(filtered);
  }, [categories, searchTerm]);

  // Initialize custom value when component mounts or value changes
  useEffect(() => {
    if (value && !findCategoryByName(value)) {
      setIsCustomInput(true);
      setCustomValue(value);
    } else {
      setCustomValue('');
      setIsCustomInput(false);
    }
  }, [value, categories]);

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/woocommerce/categories');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch categories: ${response.statusText}`);
      }
      
      const response_data = await response.json();
      
      if (response_data.error) {
        throw new Error(response_data.error);
      }
      
      // The API returns data nested under 'data' property
      const categories_data = response_data.data?.categories || response_data.categories || [];
      console.log('🏷️ [CATEGORY-SELECT] API Response:', response_data);
      console.log('🏷️ [CATEGORY-SELECT] Categories extracted:', categories_data);
      setCategories(categories_data);
    } catch (err) {
      console.error('Failed to fetch WooCommerce categories:', err);
      setError(err instanceof Error ? err.message : 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  // Flatten hierarchical categories for easier searching
  const flattenCategories = (cats: WooCommerceCategory[]): WooCommerceCategory[] => {
    const flattened: WooCommerceCategory[] = [];
    
    const traverse = (categories: WooCommerceCategory[], level = 0) => {
      categories.forEach(cat => {
        // Add level indicator for visual hierarchy
        flattened.push({
          ...cat,
          name: '  '.repeat(level) + cat.name
        });
        
        if (cat.children && cat.children.length > 0) {
          traverse(cat.children, level + 1);
        }
      });
    };
    
    traverse(cats);
    return flattened;
  };

  const findCategoryByName = (name: string): WooCommerceCategory | null => {
    const flattened = flattenCategories(categories);
    return flattened.find(cat => cat.name.trim() === name.trim()) || null;
  };

  const handleCategorySelect = (category: WooCommerceCategory) => {
    const cleanName = category.name.trim();
    onChange(cleanName, category.id);
    setIsOpen(false);
    setSearchTerm('');
    setIsCustomInput(false);
    setCustomValue('');
  };

  const handleCustomInput = () => {
    setIsCustomInput(true);
    setIsOpen(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleCustomValueChange = (newValue: string) => {
    setCustomValue(newValue);
    onChange(newValue);
  };

  const handleCustomValueSubmit = () => {
    if (customValue.trim()) {
      onChange(customValue.trim());
      setIsCustomInput(false);
    }
  };

  const handleCancelCustomInput = () => {
    setIsCustomInput(false);
    setCustomValue('');
    onChange('');
  };

  const getDisplayValue = () => {
    if (isCustomInput) return customValue;
    if (value) return value;
    return '';
  };

  const renderDropdownContent = () => {
    if (loading) {
      return (
        <div className="p-4 text-center text-sm text-muted-foreground">
          Loading categories...
        </div>
      );
    }

    if (error) {
      return (
        <div className="p-4 text-center">
          <p className="text-sm text-red-600 mb-2">{error}</p>
          <Button size="sm" variant="outline" onClick={fetchCategories}>
            Try Again
          </Button>
        </div>
      );
    }

    if (filteredCategories.length === 0 && searchTerm) {
      return (
        <div className="p-4 text-center">
          <p className="text-sm text-muted-foreground mb-2">
            No categories found for "{searchTerm}"
          </p>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={handleCustomInput}
            className="text-xs"
          >
            <Plus className="h-3 w-3 mr-1" />
            Use "{searchTerm}" as custom category
          </Button>
        </div>
      );
    }

    return (
      <>
        {filteredCategories.map((category) => {
          const isSelected = value === category.name.trim();
          return (
            <div
              key={category.id}
              className={cn(
                "flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-accent/50 transition-colors text-sm",
                isSelected && "bg-accent"
              )}
              onClick={() => handleCategorySelect(category)}
            >
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{category.name}</div>
                {category.description && (
                  <div className="text-xs text-muted-foreground truncate">
                    {category.description}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {category.count > 0 && (
                  <span className="text-xs bg-muted px-1.5 py-0.5 rounded">
                    {category.count}
                  </span>
                )}
                {isSelected && <Check className="h-4 w-4 text-primary" />}
              </div>
            </div>
          );
        })}
        
        <div className="border-t p-2">
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={handleCustomInput}
            className="w-full justify-start text-xs"
          >
            <Plus className="h-3 w-3 mr-2" />
            Add custom category
          </Button>
        </div>
      </>
    );
  };

  if (isCustomInput) {
    return (
      <div className="space-y-2">
        {label && <Label htmlFor={id}>{label}</Label>}
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            id={id}
            value={customValue}
            onChange={(e) => handleCustomValueChange(e.target.value)}
            placeholder="Enter custom category name"
            className={className}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleCustomValueSubmit();
              } else if (e.key === 'Escape') {
                handleCancelCustomInput();
              }
            }}
          />
          <Button
            size="sm"
            onClick={handleCustomValueSubmit}
            disabled={!customValue.trim()}
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCancelCustomInput}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Press Enter to save or Escape to cancel
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {label && <Label htmlFor={id}>{label}</Label>}
      <div className="relative" ref={dropdownRef}>
        <Button
          id={id}
          variant="outline"
          className={cn(
            "w-full justify-between font-normal",
            !value && "text-muted-foreground",
            className
          )}
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
        >
          <span className="truncate">
            {getDisplayValue() || placeholder}
          </span>
          <ChevronDown className={cn(
            "h-4 w-4 transition-transform",
            isOpen && "transform rotate-180"
          )} />
        </Button>

        {isOpen && (
          <div className="absolute z-50 mt-1 w-full bg-popover border rounded-md shadow-lg max-h-60 overflow-hidden">
            {/* Search header */}
            <div className="p-3 border-b">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 h-8"
                />
              </div>
            </div>

            {/* Categories list */}
            <div className="max-h-40 overflow-y-auto">
              {renderDropdownContent()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default WooCommerceCategorySelect; 