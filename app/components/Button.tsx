interface ButtonProps {
  label: string;
  onClick: (e?: React.MouseEvent<HTMLButtonElement>) => void; 
  className?: string; 
}

const Button: React.FC<ButtonProps> = ({ label, onClick, className }) => {
  return (
    <button
      onClick={onClick}
      className={`py-2 px-4 rounded-md transition-all ${className}`}
    >
      {label}
    </button>
  );
};

export default Button;
