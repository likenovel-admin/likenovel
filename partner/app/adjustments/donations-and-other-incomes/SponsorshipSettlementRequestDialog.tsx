"use client";

import { useRequestSponsorshipSettlement } from "@/api/income-settlement";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { catchErrorMessage, showAlert } from "@/lib/utils";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { FormEvent, useState } from "react";

const ACCOUNT_NUMBER_PATTERN = /^[0-9-]{5,30}$/;
const RESIDENT_REGISTRATION_NUMBER_PATTERN = /^\d{6}-?\d{7}$/;

const emptyForm = {
  account_holder: "",
  bank_name: "",
  account_number: "",
  resident_registration_number: "",
};

export default function SponsorshipSettlementRequestDialog() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const requestSettlement = useRequestSponsorshipSettlement();

  const handleOpenChange = (next: boolean) => {
    if (requestSettlement.isPending) return;
    setOpen(next);
    if (!next) {
      setForm(emptyForm);
      setFormError("");
    }
  };

  const handleChange =
    (key: keyof typeof emptyForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const body = {
      account_holder: form.account_holder.trim(),
      bank_name: form.bank_name.trim(),
      account_number: form.account_number.trim(),
      resident_registration_number: form.resident_registration_number.trim(),
    };
    if (
      !body.account_holder ||
      !body.bank_name ||
      !body.account_number ||
      !body.resident_registration_number
    ) {
      setFormError(
        "예금주명, 은행명, 계좌번호, 주민등록번호를 모두 입력해 주세요."
      );
      return;
    }
    if (!ACCOUNT_NUMBER_PATTERN.test(body.account_number)) {
      setFormError("계좌번호는 숫자와 하이픈(-)만 5~30자로 입력해 주세요.");
      return;
    }
    if (
      !RESIDENT_REGISTRATION_NUMBER_PATTERN.test(
        body.resident_registration_number
      )
    ) {
      setFormError("주민등록번호는 숫자 13자리로 입력해 주세요.");
      return;
    }
    setFormError("");
    requestSettlement.mutate(body, {
      onSuccess: () => {
        setOpen(false);
        setForm(emptyForm);
        showAlert(
          "정산신청 완료",
          "후원금 정산신청이 접수되었습니다.\n확인 후 입력하신 계좌로 입금해 드립니다.",
          "확인"
        );
      },
      onError: (err) => {
        setFormError(catchErrorMessage(err) || "정산신청에 실패했습니다.");
      },
    });
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <DialogPrimitive.Trigger asChild>
        <Button>후원금 정산신청</Button>
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60" />
        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-background p-6 shadow-lg">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <DialogPrimitive.Title className="text-lg font-semibold">
                후원금 정산신청
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="mt-1 text-sm text-muted-foreground">
                입금받을 계좌를 입력해 주세요. 확정된 후원 정산액을 확인한 뒤
                입금해 드립니다. 정산신청은 한 달에 한 번 할 수 있습니다.
              </DialogPrimitive.Description>
            </div>
            <DialogPrimitive.Close
              className="rounded-sm opacity-70 hover:opacity-100"
              aria-label="닫기"
            >
              <X className="h-4 w-4" />
            </DialogPrimitive.Close>
          </div>
          <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
            <label className="flex flex-col gap-1 text-sm">
              예금주명
              <Input
                value={form.account_holder}
                onChange={handleChange("account_holder")}
                maxLength={50}
                placeholder="홍길동"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              은행명
              <Input
                value={form.bank_name}
                onChange={handleChange("bank_name")}
                maxLength={50}
                placeholder="국민은행"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              계좌번호
              <Input
                value={form.account_number}
                onChange={handleChange("account_number")}
                maxLength={30}
                inputMode="numeric"
                placeholder="숫자와 하이픈(-)만 입력"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              주민등록번호
              <Input
                value={form.resident_registration_number}
                onChange={handleChange("resident_registration_number")}
                maxLength={14}
                inputMode="numeric"
                autoComplete="off"
                placeholder="900101-1234567"
              />
              <span className="text-xs text-muted-foreground">
                후원금 원천징수 세금 신고에만 사용하며 서비스에 저장하지
                않습니다.
              </span>
            </label>
            {formError && (
              <p className="text-sm text-red-600" role="alert">
                {formError}
              </p>
            )}
            <div className="mt-2 flex justify-end gap-2">
              <DialogPrimitive.Close asChild>
                <Button type="button" variant="outline">
                  취소
                </Button>
              </DialogPrimitive.Close>
              <Button type="submit" disabled={requestSettlement.isPending}>
                {requestSettlement.isPending ? "신청 중..." : "신청하기"}
              </Button>
            </div>
          </form>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
