import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import Link from "next/link";

interface Props {
    data:{
        no?:number,
        item:string,
        value?:number,
        link?:string,
        linkName?:string,
        radix?:number,
        unit?:string
    }[]
}

const AnalysisDataTable = ({data}:Props) => {
    return (
        <Table>
            {/*<TableCaption>A list of your recent invoices.</TableCaption>*/}
            {/*<TableHeader>
                <TableRow>
                    <TableHead className="w-[100px]">Invoice</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Method</TableHead>
                </TableRow>
            </TableHeader>*/}
            <TableBody>
                {data.map((row, index) => (
                    <TableRow key={index} className="flex items-center justify-between">
                        <TableCell className="font-medium">{row.no}.</TableCell>
                        <TableCell>{row.item}</TableCell>
                        <TableCell className="ml-auto">
                            {
                                (
                                    row?.link && <Link href={row.link} target="_blank" className="text-blue-500 font-semibold">{row?.linkName}</Link>
                                )
                            }
                            {
                                (row?.value !== undefined
                                    && (
                                        row?.radix
                                            ? row.value.toFixed(row.radix)
                                            : row.value.toLocaleString('ko-KR')
                                    )
                                    + " " +row?.unit  || ""
                                )
                            }

                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
            {/*<TableFooter>
                <TableRow>
                    <TableCell colSpan={3}>Total</TableCell>
                    <TableCell className="text-right">$2,500.00</TableCell>
                </TableRow>
            </TableFooter>*/}
        </Table>
    )
}

/*
const AnalysisDataTable = ({data}:Props) => {
    console.log("data:", data.value)
    return (
        <div>
            {data.map((item:any, index:number) => (
                <div key={index}>
                    {item.no}
                </div>
            ))}
        </div>
    )
}
*/
export default AnalysisDataTable
