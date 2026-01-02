"use client";

import { Badge } from "@arcle/ui/components/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@arcle/ui/components/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@arcle/ui/components/popover";
import { cn } from "@arcle/ui/lib/utils";
import { CaretUpDown, X } from "@phosphor-icons/react";
import { useState } from "react";

export type Option = {
  value: string;
  label: string;
};

type MultiSelectProps = {
  options: Option[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  emptyMessage?: string;
  className?: string;
  disabled?: boolean;
  maxDisplayItems?: number;
};

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select items...",
  emptyMessage = "No items found.",
  className,
  disabled = false,
  maxDisplayItems = 2,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const handleRemove = (value: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selected.filter((v) => v !== value));
  };

  const selectedOptions = options.filter((opt) => selected.includes(opt.value));
  const displayedOptions = open
    ? selectedOptions
    : selectedOptions.slice(0, maxDisplayItems);
  const remainingCount = selectedOptions.length - displayedOptions.length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={disabled}
        className={cn(
          "flex min-h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
      >
        <div
          className={cn(
            "flex gap-1 flex-1 overflow-hidden",
            open && "flex-wrap",
          )}
        >
          {selectedOptions.length > 0 ? (
            <>
              {displayedOptions.map((opt) => (
                <Badge
                  key={opt.value}
                  variant="secondary"
                  className="gap-1 shrink-0"
                >
                  {opt.label}
                  {open && (
                    <span
                      role="button"
                      tabIndex={0}
                      className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
                      onClick={(e) => handleRemove(opt.value, e)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleRemove(
                            opt.value,
                            e as unknown as React.MouseEvent,
                          );
                        }
                      }}
                    >
                      <X className="h-3 w-3" />
                    </span>
                  )}
                </Badge>
              ))}
              {remainingCount > 0 && (
                <Badge variant="secondary" className="shrink-0">
                  +{remainingCount} more
                </Badge>
              )}
            </>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </div>
        <CaretUpDown className="h-4 w-4 shrink-0 opacity-50 ml-2" />
      </PopoverTrigger>
      <PopoverContent
        className="w-full min-w-[var(--anchor-width)] p-0"
        align="start"
      >
        <Command>
          <CommandInput placeholder="Search..." />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((opt) => {
                const isSelected = selected.includes(opt.value);
                return (
                  <CommandItem
                    key={opt.value}
                    value={opt.value}
                    onSelect={() => handleSelect(opt.value)}
                    data-checked={isSelected}
                  >
                    {opt.label}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
