type CommonSelectItem = {
  label: ReactNode;
  value: ReactText;
  disabled?: boolean;
  href?: string;
};

type CommonModalProps = {
  isOpen: boolean;
  setIsOpen?: Dispatch<SetStateAction<boolean>>;
  onClose: () => void;
};
