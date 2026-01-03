"use client"

import {ComponentPropsWithoutRef, ElementRef, forwardRef} from "react";
import { cn } from "@/lib/utils"
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
    navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"

const components: { title: string; href: string; description: string }[] = [
    {
        title: "일매출통계",
        href: "/docs/primitives/alert-dialog",
        description:
            "",
    },
    {
        title: "상세통계",
        href: "/docs/primitives/hover-card",
        description:
            "",
    },
    {
        title: "발굴통계",
        href: "/docs/primitives/hover-card",
        description:
            "",
    },
]
export default function NaviMenu() {
    return (
        <NavigationMenu>
            <NavigationMenuList>
                <NavigationMenuItem>
                    <NavigationMenuTrigger><span className="text-[1.1rem] font-semibold">정산</span></NavigationMenuTrigger>
                    <NavigationMenuContent>
                        <ul className="grid gap-3 p-4 w-[350px] md:w-[400px] lg:w-[500px] md:grid-cols-[.75fr_1fr]">
                            {/*<li className="row-span-3">
                                <NavigationMenuLink asChild>
                                    <a
                                        className="flex h-full w-full select-none flex-col justify-end rounded-md
                                                    bg-gradient-to-b from-muted/50 to-muted
                                                    bg-amber-400/80
                                                    p-3 no-underline outline-none focus:shadow-md"
                                        href="/"
                                    >
                                        <div className="mb-2 mt-4 text-lg font-medium">
                                            월정산 일자 공지
                                        </div>
                                        <p className="text-sm leading-tight text-muted-foreground">
                                            월말까지 월정산을 신청하세요
                                        </p>
                                    </a>
                                </NavigationMenuLink>
                            </li>*/}
                            <ListItem href="/docs" title="판매정산">
                                판매한 작품을 정산합니다(1일 ~ 31일 기준)
                            </ListItem>
                            <ListItem href="/docs/installation" title="후원정산">
                                후원받은 내역을 정산합니다.
                            </ListItem>
                        </ul>
                    </NavigationMenuContent>
                </NavigationMenuItem>
                <NavigationMenuItem>
                    <NavigationMenuTrigger><span className="text-[1.1rem] font-semibold">작품통계</span></NavigationMenuTrigger>
                    <NavigationMenuContent>
                        <ul className="grid w-[350px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] ">
                            {components.map((component) => (
                                <ListItem
                                    key={component.title}
                                    title={component.title}
                                    href={component.href}
                                >
                                    {component.description}
                                </ListItem>
                            ))}
                        </ul>
                    </NavigationMenuContent>
                </NavigationMenuItem>
                {/*<NavigationMenuItem>
                    <Link href="/docs" legacyBehavior passHref>
                        <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                            Documentation
                        </NavigationMenuLink>
                    </Link>
                </NavigationMenuItem>*/}
            </NavigationMenuList>
        </NavigationMenu>
    )
}

const ListItem = forwardRef<
    ElementRef<"a">,
    ComponentPropsWithoutRef<"a">
>(({ className, title, children, ...props }, ref) => {
    return (
        <li>
            <NavigationMenuLink asChild>
                <a
                    ref={ref}
                    className={cn(
                        "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                        className
                    )}
                    {...props}
                >
                    <div className="text-sm font-medium leading-none">{title}</div>
                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                        {children}
                    </p>
                </a>
            </NavigationMenuLink>
        </li>
    )
})
ListItem.displayName = "ListItem"
