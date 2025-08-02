"use client";

import React from "react";
import { motion } from "framer-motion";

const LoadingScreen: React.FC = () => {
  const dotVariants = {
    initial: { y: 0 },
    animate: {
      y: -30,
      transition: {
        duration: 0.6,
        repeat: Infinity,
        repeatType: "mirror" as const,
        ease: "easeInOut" as const,
      },
    },
  };

  const containerVariants = {
    animate: {
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0,
      },
    },
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "white",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
      }}
    >
      <motion.div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "10px",
        }}
        variants={containerVariants}
        initial="initial"
        animate="animate"
      >
        {[1, 2, 3].map((index) => (
          <motion.div
            key={index}
            style={{
              width: "20px",
              height: "20px",
              borderRadius: "50%",
              backgroundColor: "#764ba2",
              willChange: "transform",
            }}
            variants={dotVariants}
          />
        ))}
      </motion.div>
    </div>
  );
};

export default LoadingScreen;

