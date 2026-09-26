"use client";

import { useState, type ReactNode } from "react";
import Disclosure from "@/playground/Disclosure";
import Tabs, { type Tab } from "@/playground/Tabs";
import Modal from "@/playground/Modal";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs as ShadcnTabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const tabs: Tab[] = [
  { label: "HTML", content: <p>HTML gives the page its structure.</p> },
  { label: "CSS", content: <p>CSS controls colours, spacing and layout.</p> },
  { label: "JavaScript", content: <p>JavaScript makes the page interactive.</p> },
];

const primaryButton =
  "rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600";
const secondaryButton =
  "rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600";
const input =
  "mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-indigo-600";

function Card({ title, keys, children }: { title: string; keys: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
      <p className="mt-1 mb-5 text-sm text-slate-500">Keyboard: {keys}</p>
      {children}
    </section>
  );
}

export default function PlaygroundPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12 text-slate-900">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-bold tracking-tight">Accessible Components Playground</h1>
          <p className="mt-3 text-slate-500">
            Disclosure, Tabs and Modal built from scratch using the W3C ARIA Authoring Practices.
          </p>
        </header>

        <Card title="Disclosure" keys="Tab to the button, Enter or Space to toggle">
          <Disclosure title="What is accessibility?">
            <p>Building websites that everyone can use, including keyboard and screen reader users.</p>
          </Disclosure>
        </Card>

        <Card title="Tabs" keys="Arrow Left / Right to switch, Home / End, Tab to enter the panel">
          <Tabs label="Web technologies" tabs={tabs} />
        </Card>

        <Card title="Modal" keys="Enter to open, Tab / Shift+Tab stay inside, Escape to close">
          <button type="button" className={primaryButton} onClick={() => setIsModalOpen(true)}>
            Open modal
          </button>

          <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title="Subscribe">
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                setIsModalOpen(false);
              }}
            >
              <label className="block text-sm font-medium text-slate-700">
                Name
                <input type="text" className={input} />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Email
                <input type="email" className={input} />
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className={secondaryButton} onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className={primaryButton}>
                  Subscribe
                </button>
              </div>
            </form>
          </Modal>
        </Card>

        <div className="pt-10 pb-2 text-center">
          <h2 className="text-2xl font-bold tracking-tight">shadcn/ui version</h2>
          <p className="mt-2 text-slate-500">
            The same Tabs and Modal using shadcn (built on Radix), for comparison. See NOTES.md.
          </p>
        </div>

        <Card title="Tabs (shadcn)" keys="same keys as above">
          <ShadcnTabs defaultValue={tabs[0].label}>
            <TabsList aria-label="Web technologies (shadcn)">
              {tabs.map((tab) => (
                <TabsTrigger key={tab.label} value={tab.label}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {tabs.map((tab) => (
              <TabsContent key={tab.label} value={tab.label} className="p-4 text-slate-600">
                {tab.content}
              </TabsContent>
            ))}
          </ShadcnTabs>
        </Card>

        <Card title="Dialog (shadcn)" keys="same keys as above">
          <Dialog>
            <DialogTrigger asChild>
              <Button>Open shadcn dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <form className="grid gap-4" onSubmit={(event) => event.preventDefault()}>
                <DialogHeader>
                  <DialogTitle>Subscribe</DialogTitle>
                  <DialogDescription>Enter your name and email to subscribe.</DialogDescription>
                </DialogHeader>
                <label className="block text-sm font-medium text-slate-700">
                  Name
                  <input type="text" className={input} />
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Email
                  <input type="email" className={input} />
                </label>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button type="submit">Subscribe</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </Card>
      </div>
    </main>
  );
}
