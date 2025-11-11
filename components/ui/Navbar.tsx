"use client";

import { useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ThemeToggle } from "./ThemeToggle";
import { SettingsModal } from "./SettingsModal";
import { motion } from "framer-motion";
import Image from "next/image";
import { SettingsIcon, ArrowLeftRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navbar() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className="flex items-center justify-between px-3 py-3 border-b relative"
      style={{ borderColor: "var(--border)" }}
    >
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="flex items-center justify-start gap-2 sm:gap-4 min-w-0 flex-1 z-10"
      >
        <Link href="/">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-1 ml-4 sm:ml-0 cursor-pointer"
          >
            <Image
              src="/filecoin.svg"
              alt="Filecoin"
              width={24}
              height={24}
              className="w-[30px] h-[30px]  flex-shrink-0"
            />
            <h1 className="text-sm sm:text-xl font-bold truncate flex-col items-center text-left lg:flex hidden">
              Filecoin Onchain Cloud dApp
            </h1>
          </motion.div>
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-2 ml-4">
          <Link href="/">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-3 py-1.5 rounded-lg transition-colors text-sm cursor-pointer inline-block ${
                pathname === "/"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-secondary/20"
              }`}
            >
              Storage
            </motion.div>
          </Link>
          <Link href="/swap">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-3 py-1.5 rounded-lg transition-colors text-sm flex items-center gap-1 cursor-pointer ${
                pathname === "/swap"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-secondary/20"
              }`}
            >
              <ArrowLeftRight className="w-4 h-4" />
              OnlySwap
            </motion.div>
          </Link>
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
        className="flex items-center gap-2 flex-shrink-0 justify-end z-10"
      >
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 rounded-lg transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
            style={{
              backgroundColor: "transparent",
              color: "var(--foreground)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--muted)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
            aria-label="Open settings"
          >
            <SettingsIcon className="w-5 h-5" />
          </button>
        </motion.div>
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
          <ThemeToggle />
        </motion.div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <ConnectButton />
        </motion.div>
      </motion.div>
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </motion.nav>
  );
}
