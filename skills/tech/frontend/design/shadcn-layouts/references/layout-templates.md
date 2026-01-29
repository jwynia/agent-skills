# Layout Templates Reference

Copy-paste starting points for common layout patterns.

## Full-Page Layouts

### Basic App Shell (Sidebar + Content)

```tsx
// app/layout.tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full">{children}</body>
    </html>
  )
}

// app/(dashboard)/layout.tsx
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-full">
      {/* Fixed sidebar */}
      <aside className="w-64 shrink-0 border-r bg-muted/40 overflow-y-auto">
        <div className="p-4">
          <h2 className="font-semibold">Navigation</h2>
          <nav className="mt-4 space-y-2">
            {/* Nav items */}
          </nav>
        </div>
      </aside>

      {/* Scrollable main */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
```

### Dashboard with Header + Sidebar

```tsx
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col h-screen">
      {/* Fixed header */}
      <header className="h-14 shrink-0 border-b bg-background">
        <div className="flex h-full items-center px-4">
          <h1 className="font-semibold">App Name</h1>
          <div className="ml-auto flex items-center gap-4">
            {/* Header actions */}
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <aside className="w-64 shrink-0 border-r overflow-y-auto">
          <nav className="p-4 space-y-2">
            {/* Nav items */}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 overflow-y-auto">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
```

### Collapsible Sidebar (with shadcn Sidebar)

```tsx
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <Sidebar>
          <SidebarHeader>
            <h2 className="font-semibold px-4 py-2">App Name</h2>
          </SidebarHeader>
          <SidebarContent>
            {/* Navigation */}
          </SidebarContent>
          <SidebarFooter>
            {/* Footer content */}
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 min-w-0 overflow-y-auto">
          <div className="flex items-center gap-2 p-4 border-b">
            <SidebarTrigger />
            <h1>Page Title</h1>
          </div>
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}
```

---

## Split Panels

### Two-Column Resizable

```tsx
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable"

export default function SplitView() {
  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="h-full rounded-lg border"
    >
      <ResizablePanel defaultSize={30} minSize={20}>
        <div className="h-full overflow-y-auto p-4">
          <h3 className="font-semibold mb-4">Left Panel</h3>
          {/* Content */}
        </div>
      </ResizablePanel>

      <ResizableHandle withHandle />

      <ResizablePanel defaultSize={70}>
        <div className="h-full overflow-y-auto p-4">
          <h3 className="font-semibold mb-4">Right Panel</h3>
          {/* Content */}
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
```

### Three-Column (Sidebar + Content + Details)

```tsx
<ResizablePanelGroup direction="horizontal" className="h-full">
  <ResizablePanel defaultSize={20} minSize={15}>
    <div className="h-full overflow-y-auto p-4">
      {/* Navigation/list */}
    </div>
  </ResizablePanel>

  <ResizableHandle />

  <ResizablePanel defaultSize={50}>
    <div className="h-full overflow-y-auto p-4">
      {/* Main content */}
    </div>
  </ResizablePanel>

  <ResizableHandle />

  <ResizablePanel defaultSize={30} minSize={20}>
    <div className="h-full overflow-y-auto p-4">
      {/* Details panel */}
    </div>
  </ResizablePanel>
</ResizablePanelGroup>
```

---

## Content Layouts

### Card Grid (Responsive)

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  {items.map((item) => (
    <Card key={item.id}>
      <CardHeader>
        <CardTitle>{item.title}</CardTitle>
        <CardDescription>{item.description}</CardDescription>
      </CardHeader>
      <CardContent>
        {item.content}
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full">
          View
        </Button>
      </CardFooter>
    </Card>
  ))}
</div>
```

### List with Actions

```tsx
<div className="divide-y rounded-lg border">
  {items.map((item) => (
    <div
      key={item.id}
      className="flex items-center justify-between p-4 hover:bg-muted/50"
    >
      <div className="flex items-center gap-4">
        <Avatar>
          <AvatarImage src={item.avatar} />
          <AvatarFallback>{item.initials}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium">{item.name}</p>
          <p className="text-sm text-muted-foreground">{item.email}</p>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>Edit</DropdownMenuItem>
          <DropdownMenuItem className="text-destructive">
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  ))}
</div>
```

### Page with Tabs

```tsx
<div className="space-y-6">
  <div>
    <h1 className="text-3xl font-bold">Settings</h1>
    <p className="text-muted-foreground">
      Manage your account settings
    </p>
  </div>

  <Tabs defaultValue="general" className="space-y-4">
    <TabsList>
      <TabsTrigger value="general">General</TabsTrigger>
      <TabsTrigger value="security">Security</TabsTrigger>
      <TabsTrigger value="notifications">Notifications</TabsTrigger>
    </TabsList>

    <TabsContent value="general" className="space-y-4">
      {/* General settings content */}
    </TabsContent>

    <TabsContent value="security" className="space-y-4">
      {/* Security settings content */}
    </TabsContent>

    <TabsContent value="notifications" className="space-y-4">
      {/* Notification settings content */}
    </TabsContent>
  </Tabs>
</div>
```

---

## Form Layouts

### Single Column Form

```tsx
<Card className="max-w-md">
  <CardHeader>
    <CardTitle>Create Account</CardTitle>
    <CardDescription>Enter your details below</CardDescription>
  </CardHeader>
  <CardContent>
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="john@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">
          Submit
        </Button>
      </form>
    </Form>
  </CardContent>
</Card>
```

### Two Column Form

```tsx
<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField
        control={form.control}
        name="firstName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>First Name</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="lastName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Last Name</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>

    {/* Full width field */}
    <FormField
      control={form.control}
      name="email"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Email</FormLabel>
          <FormControl>
            <Input type="email" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />

    <div className="flex justify-end gap-4">
      <Button type="button" variant="outline">
        Cancel
      </Button>
      <Button type="submit">Save</Button>
    </div>
  </form>
</Form>
```

---

## Modal/Dialog Layouts

### Form Dialog

```tsx
<Dialog>
  <DialogTrigger asChild>
    <Button>Add Item</Button>
  </DialogTrigger>
  <DialogContent className="sm:max-w-[425px]">
    <DialogHeader>
      <DialogTitle>Add New Item</DialogTitle>
      <DialogDescription>
        Fill in the details below to add a new item.
      </DialogDescription>
    </DialogHeader>

    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter>
          <Button type="submit">Add Item</Button>
        </DialogFooter>
      </form>
    </Form>
  </DialogContent>
</Dialog>
```

### Confirmation Dialog

```tsx
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">Delete</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
      <AlertDialogDescription>
        This action cannot be undone. This will permanently delete
        the item from our servers.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={handleDelete}>
        Delete
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### Sheet (Side Panel)

```tsx
<Sheet>
  <SheetTrigger asChild>
    <Button variant="outline">Open Settings</Button>
  </SheetTrigger>
  <SheetContent>
    <SheetHeader>
      <SheetTitle>Settings</SheetTitle>
      <SheetDescription>
        Configure your preferences here.
      </SheetDescription>
    </SheetHeader>

    <div className="py-4 space-y-4">
      {/* Settings content */}
    </div>

    <SheetFooter>
      <Button type="submit">Save changes</Button>
    </SheetFooter>
  </SheetContent>
</Sheet>
```

---

## Table Layouts

### Basic Data Table

```tsx
<div className="rounded-md border">
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead className="w-[100px]">ID</TableHead>
        <TableHead>Name</TableHead>
        <TableHead>Status</TableHead>
        <TableHead className="text-right">Amount</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {data.map((row) => (
        <TableRow key={row.id}>
          <TableCell className="font-medium">{row.id}</TableCell>
          <TableCell>{row.name}</TableCell>
          <TableCell>
            <Badge variant={row.status === 'active' ? 'default' : 'secondary'}>
              {row.status}
            </Badge>
          </TableCell>
          <TableCell className="text-right">{row.amount}</TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</div>
```

### Table with Scroll (Fixed Height)

```tsx
<div className="rounded-md border">
  {/* Fixed header */}
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead className="w-[100px]">ID</TableHead>
        <TableHead>Name</TableHead>
        <TableHead>Status</TableHead>
      </TableRow>
    </TableHeader>
  </Table>

  {/* Scrollable body */}
  <div className="max-h-[400px] overflow-y-auto">
    <Table>
      <TableBody>
        {data.map((row) => (
          <TableRow key={row.id}>
            <TableCell className="w-[100px]">{row.id}</TableCell>
            <TableCell>{row.name}</TableCell>
            <TableCell>{row.status}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
</div>
```

---

## Critical Classes Quick Reference

| Purpose | Classes |
|---------|---------|
| Full viewport height | `h-screen` or `h-dvh` (mobile-safe) |
| Full parent height (chain required) | `h-full` |
| Minimum full height | `min-h-screen` or `min-h-full` |
| Flex child that scrolls | `flex-1 min-h-0 overflow-y-auto` |
| Flex child that doesn't shrink | `shrink-0` |
| Prevent text overflow pushing width | `min-w-0` |
| Basic grid | `grid grid-cols-{n} gap-{n}` |
| Responsive grid | `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3` |
