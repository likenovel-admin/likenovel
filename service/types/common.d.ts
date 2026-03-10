type CommonSelectItem = {
  label: ReactNode;
  value: ReactText;
  disabled?: boolean;
};

type CommonModalProps = {
  isOpen: boolean;
  setIsOpen?: Dispatch<SetStateAction<boolean>>;
  onClose: () => void;
};
