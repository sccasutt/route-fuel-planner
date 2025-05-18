
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface SectionHeaderProps {
  title: string;
  linkTo?: string;
  linkText?: string;
}

export function SectionHeader({ 
  title, 
  linkTo, 
  linkText = "View All" 
}: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-xl font-bold">{title}</h2>
      {linkTo && (
        <Link to={linkTo}>
          <Button variant="outline" size="sm">{linkText}</Button>
        </Link>
      )}
    </div>
  );
}
