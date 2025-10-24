'use client'

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

// Componente del modal de Contact Us
export function ContactUsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader className="pb-4">
                    <DialogTitle className="text-lg font-semibold">Useful Links</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 text-sm">
                    <p className="text-gray-600">
                        For fastest help <span className="font-medium">(preferred method)</span>, ask the{" "}
                        <a
                            href="https://webpushr.com/forum"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline"
                        >
                            Webpushr Forum
                        </a>
                    </p>

                    <div className="space-y-2">
                        <p>
                            <span className="text-gray-600">E-mail (Sales): </span>
                            <a
                                href="mailto:sales@webpushr.com"
                                className="text-blue-600 hover:text-blue-800 underline"
                            >
                                sales@webpushr.com
                            </a>
                        </p>

                        <div>
                            <p>
                                <span className="text-gray-600">E-mail (Support): </span>
                                <a
                                    href="mailto:support@webpushr.com"
                                    className="text-blue-600 hover:text-blue-800 underline"
                                >
                                    support@webpushr.com
                                </a>
                            </p>
                            <p className="text-gray-600 text-xs mt-1">
                                Please send us your e-mail id if you decide to e-mail us. As you can imagine, we cannot locate your account unless we get your e-mail id.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <Button onClick={onClose} variant="secondary">
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}