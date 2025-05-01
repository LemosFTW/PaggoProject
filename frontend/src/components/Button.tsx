import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
}

const DefaultButton = ({ children, className, ...props }: ButtonProps) => {
  return (
    <button className={`${className}  hover:animate-pulse hover:scale-105 transition-all duration-300 cursor-pointer` } {...props}>
      {children}
    </button>
  );
};

export const LoggedOutButton = ({ children, className, ...props }: ButtonProps) => {
  return (
    <DefaultButton className={className} {...props}>
      {children}
    </DefaultButton>
  );
};


export const UploadButton = ({ children, className, ...props }: ButtonProps) => {
  return (
    <DefaultButton className={className} {...props}>
      {children}
    </DefaultButton>
  );
};

export const PrimaryButton = ({ children, className, ...props }: ButtonProps) => {
  return (
    <DefaultButton className={`bg-blue-500 text-white p-2 rounded ${className}`} {...props}>
      {children}
    </DefaultButton>
  );
}
