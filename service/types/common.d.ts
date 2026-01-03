type CommonSelectItem = {
  label: ReactNode;
  value: ReactText;
};

type CommonModalProps = {
  isOpen: boolean;
  setIsOpen?: Dispatch<SetStateAction<boolean>>;
  onClose: () => void;
};
