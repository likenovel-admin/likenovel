"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, SubmitHandler } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "@radix-ui/react-icons";

const formSchema = z.object({
  username: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }),
});

export default function SearchFormSetlementDefault() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    console.log(values);
  }

  type Inputs = {
    example: string;
    exampleRequired: string;
  };
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<Inputs>();
  // const onSubmit: SubmitHandler<Inputs> = (data) => console.log(data)
  // console.log(watch("example"))

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-8 font-normal"
      >
        {/*<FormField*/}
        {/*    control={form.control}*/}
        {/*    name="username"*/}
        {/*    render={({field}) => (*/}
        {/*        <FormItem>*/}
        {/*            /!*<FormLabel>Username</FormLabel>*!/*/}
        {/*            <FormControl>*/}
        {/*                <Input placeholder="입력하세요" {...field} className="rounded" />*/}
        {/*            </FormControl>*/}
        {/*            <FormMessage/>*/}
        {/*        </FormItem>*/}
        {/*    )}*/}
        {/*/>*/}
        <div className="mt-5 pb-5 grid gap-2 grid-cols-5 border-b-2 lg:grid-cols-7">
          <span className="flex items-center justify-center ">정산기간</span>
          <div className="col-span-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="rounded border-gray-900">
                  <div className="w-24 flex items-center justify-between">
                    <span>2024.08</span>
                    <CalendarIcon />
                  </div>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="mx-4 w-80">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    {/*<h4 className="font-medium leading-none">정산기간 선택</h4>*/}
                    {/*<p className="text-sm text-muted-foreground">
                                            Set the dimensions for the layer.
                                        </p>*/}
                    <div className="mb-4 flex h-8 items-center justify-between">
                      <div className="rotate-180 cursor-pointer">
                        <svg
                          viewBox="0 0 16 16"
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                        >
                          <g fill="none">
                            <path d="M2 2h12v12H2z"></path>
                            <path
                              d="M10.091 7.909a.5.5 0 01.058.638l-.058.07-3.475 3.474a.5.5 0 01-.765-.638l.058-.07 3.121-3.12-3.146-3.147a.5.5 0 01-.058-.638l.058-.069a.5.5 0 01.638-.058l.069.058 3.5 3.5z"
                              fill="#4C4C4C"
                            ></path>
                          </g>
                        </svg>
                      </div>
                      <p className="text-black text-base font-normal">
                        {" "}
                        2024 년
                      </p>
                      <div className="cursor-pointer">
                        <svg
                          viewBox="0 0 16 16"
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                        >
                          <g fill="none">
                            <path d="M2 2h12v12H2z"></path>
                            <path
                              d="M10.091 7.909a.5.5 0 01.058.638l-.058.07-3.475 3.474a.5.5 0 01-.765-.638l.058-.07 3.121-3.12-3.146-3.147a.5.5 0 01-.058-.638l.058-.069a.5.5 0 01.638-.058l.069.058 3.5 3.5z"
                              fill="#4C4C4C"
                            ></path>
                          </g>
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="mb-4 flex justify-between flex-wrap gap-2">
                      <div className="text-base text-black font-normal h-16 w-16 cursor-pointer rounded-sm border border-gray-100 py-5 px-3 text-center hover:bg-gray-200">
                        1월
                      </div>
                      <div className="text-base text-black font-normal h-16 w-16 cursor-pointer rounded-sm border border-gray-100 py-5 px-3 text-center hover:bg-gray-200">
                        2월
                      </div>
                      <div className="text-base text-black font-normal h-16 w-16 cursor-pointer rounded-sm border border-gray-100 py-5 px-3 text-center hover:bg-gray-200">
                        3월
                      </div>
                      <div className="text-base text-black font-normal h-16 w-16 cursor-pointer rounded-sm border border-gray-100 py-5 px-3 text-center hover:bg-gray-200">
                        4월
                      </div>
                      <div className="text-base text-black font-normal h-16 w-16 cursor-pointer rounded-sm border border-gray-100 py-5 px-3 text-center hover:bg-gray-200">
                        5월
                      </div>
                      <div className="text-base text-black font-normal h-16 w-16 cursor-pointer rounded-sm border border-gray-100 py-5 px-3 text-center hover:bg-gray-200">
                        6월
                      </div>
                      <div className="text-base text-black font-normal h-16 w-16 cursor-pointer rounded-sm border border-gray-100 py-5 px-3 text-center hover:bg-gray-200">
                        7월
                      </div>
                      <div className="text-base text-black font-normal h-16 w-16 cursor-pointer rounded-sm border border-gray-100 py-5 px-3 text-center hover:bg-gray-200">
                        8월
                      </div>
                      <div className="text-base text-black font-normal h-16 w-16 cursor-pointer rounded-sm border border-gray-100 py-5 px-3 text-center hover:bg-gray-200">
                        9월
                      </div>
                      <div className="text-base text-black font-normal h-16 w-16 cursor-pointer rounded-sm border border-gray-100 py-5 px-3 text-center hover:bg-gray-200">
                        10월
                      </div>
                      <div className="text-base text-black font-normal h-16 w-16 cursor-pointer rounded-sm border border-gray-100 py-5 px-3 text-center hover:bg-gray-200">
                        11월
                      </div>
                      <div className="text-base text-black font-normal h-16 w-16 cursor-pointer rounded-sm border border-gray-100 py-5 px-3 text-center hover:bg-gray-200">
                        12월
                      </div>
                    </div>
                  </div>
                  {/*<div className="grid gap-2">
                                        <div className="grid grid-cols-3 items-center gap-4">
                                            <Label htmlFor="width">Width</Label>
                                            <Input
                                                id="width"
                                                defaultValue="100%"
                                                className="col-span-2 h-8"
                                            />
                                        </div>
                                        <div className="grid grid-cols-3 items-center gap-4">
                                            <Label htmlFor="maxWidth">Max. width</Label>
                                            <Input
                                                id="maxWidth"
                                                defaultValue="300px"
                                                className="col-span-2 h-8"
                                            />
                                        </div>
                                        <div className="grid grid-cols-3 items-center gap-4">
                                            <Label htmlFor="height">Height</Label>
                                            <Input
                                                id="height"
                                                defaultValue="25px"
                                                className="col-span-2 h-8"
                                            />
                                        </div>
                                        <div className="grid grid-cols-3 items-center gap-4">
                                        <Label htmlFor="maxHeight">Max. height</Label>
                                            <Input
                                                id="maxHeight"
                                                defaultValue="none"
                                                className="col-span-2 h-8"
                                            />
                                        </div>
                                    </div>*/}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <button className="flex items-center justify-center rounded-4 mx-auto mt-4">
          <span className="px-5 py-1 lg:px-8 lg:py-2 w-full font-semibold text-white bg-gray-600 rounded">
            조회
          </span>
        </button>
      </form>
    </Form>
    /*<form onSubmit={handleSubmit(onSubmit)}>
            <input defaultValue="test" {...register("example")} />

            <input {...register("exampleRequired", {required: true})} />
            {errors.exampleRequired && <span>This field is required</span>}
            <input type="submit"/>
        </form>*/
  );
}
