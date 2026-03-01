"use client";

import { motion } from "framer-motion";
import { Terminal, GitCommit, GitBranch, GitMerge } from "lucide-react";

const timeline = [
    {
        year: "2023",
        title: "Initial Commit",
        description: "The core platform was initialized and the first automation workflows were shipped.",
        icon: GitCommit,
    },
    {
        year: "2024",
        title: "Feature Branch: Intelligence",
        description: "Integrated LLM-powered operations workflows. The first autonomous agent went online.",
        icon: GitBranch,
    },
    {
        year: "2025",
        title: "Merge to Main",
        description: "Public beta launched with production-grade stability across multi-cloud environments.",
        icon: GitMerge,
    },
    {
        year: "2026",
        title: "v1.0.0 Release",
        description: "EdgeOps Labs launched v1.0 with a focused stack for intelligent edge orchestration.",
        icon: Terminal,
    },
];

export function CommitHistory() {
    return (
        <section className="mb-40 mt-32">
            <h2 className="text-3xl font-bold font-mono text-brand-text mb-12 flex items-center gap-3">
                <GitBranch className="text-brand-primary" />
                Commit History
            </h2>

            <div className="relative border-l border-brand-primary/20 ml-3 md:ml-12 space-y-12 pb-12">
                {timeline.map((item, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                        className="relative pl-8 md:pl-12"
                    >
                        <div className="absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full bg-brand-primary ring-4 ring-background" />

                        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mb-2">
                            <span className="font-mono text-brand-primary text-sm bg-brand-primary/10 px-2 py-1 rounded">
                                {item.icon === GitCommit && "commit"}
                                {item.icon === GitBranch && "branch"}
                                {item.icon === GitMerge && "merge"}
                                {item.icon === Terminal && "release"}
                                _{item.year}
                            </span>
                            <h3 className="text-xl font-bold text-brand-text">{item.title}</h3>
                        </div>

                        <p className="text-brand-text/60 max-w-xl">
                            {item.description}
                        </p>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}
