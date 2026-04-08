interface ToggleSwitchProps {
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
}

export default function ToggleSwitch({
  checked,
  onChange,
  disabled = false,
}: ToggleSwitchProps) {
  return (
    <label
      className="relative inline-block w-[34px] h-[18px] shrink-0"
      onClick={(e) => e.stopPropagation()}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="peer opacity-0 w-0 h-0 absolute"
      />
      {/* Slider track */}
      <span
        className={[
          "absolute inset-0 rounded-[9px] cursor-pointer transition-colors duration-200",
          checked ? "bg-yellow-600" : "bg-[#d1d5db]",
          disabled ? "cursor-not-allowed opacity-55" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {/* Slider thumb */}
        <span
          className="absolute w-[14px] h-[14px] left-[2px] top-[2px] bg-white rounded-full transition-transform duration-200"
          style={{ transform: checked ? "translateX(16px)" : "translateX(0)" }}
        />
      </span>
    </label>
  );
}
