import React from "react";
import { Input, InputProps } from "./Input";
import { SearchIcon } from "@/components/icons";

export interface SearchInputProps
  extends Omit<InputProps, "leftIcon" | "type"> {
  onSearch?: (value: string) => void;
  searchButtonLabel?: string;
}

/**
 * Search input component with integrated search icon
 */
export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      onSearch,
      searchButtonLabel = "Search",
      onKeyDown,
      ...props
    },
    ref
  ) => {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && onSearch) {
        e.preventDefault();
        onSearch(e.currentTarget.value);
      }
      onKeyDown?.(e);
    };

    return (
      <Input
        ref={ref}
        type="search"
        leftIcon={<SearchIcon />}
        onKeyDown={handleKeyDown}
        aria-label={props.label || "Search"}
        {...props}
      />
    );
  }
);

SearchInput.displayName = "SearchInput";
