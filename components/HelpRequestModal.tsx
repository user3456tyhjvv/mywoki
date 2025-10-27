import React, { useState } from 'react';

interface HelpRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: () => void;
    domain: string;
}

const HelpRequestModal: React.FC<HelpRequestModalProps> = ({ isOpen, onClose, onSubmit, domain }) => {
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit();
        setIsSubmitted(true);
        setTimeout(() => {
            onClose();
            setIsSubmitted(false);
        }, 3000);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity" onClick={onClose}>
            <div className="bg-brand-secondary border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
                {!isSubmitted ? (
                    <>
                        <h2 className="text-2xl font-bold text-white mb-2">Request Installation Help</h2>
                        <p className="text-slate-400 mb-6">Our team will install the tracking snippet on <span className="font-bold text-brand-accent">{domain}</span> for you. Please provide your contact details.</p>
                        <form onSubmit={handleSubmit}>
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-1">Full Name</label>
                                    <input type="text" id="name" required placeholder="Jane Doe" className="w-full px-3 py-2 bg-slate-800/80 border border-slate-600 rounded-lg focus:ring-2 focus:ring-brand-accent focus:outline-none transition-colors" />
                                </div>
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1">Email Address</label>
                                    <input type="email" id="email" required placeholder="jane.doe@example.com" className="w-full px-3 py-2 bg-slate-800/80 border border-slate-600 rounded-lg focus:ring-2 focus:ring-brand-accent focus:outline-none transition-colors" />
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end gap-4">
                                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-300 rounded-lg hover:bg-slate-700 transition-colors">Cancel</button>
                                <button type="submit" className="px-5 py-2 text-sm font-bold bg-brand-accent text-brand-primary rounded-lg hover:bg-white transition-colors">Submit Request</button>
                            </div>
                        </form>
                    </>
                ) : (
                    <div className="text-center py-8">
                        <div className="mx-auto w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center border-2 border-green-500/50 mb-4">
                             <svg className="w-7 h-7 text-green-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Request Sent!</h2>
                        <p className="text-slate-400">Our team has received your request and will be in touch via email within 24 hours.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HelpRequestModal;
