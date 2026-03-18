import React from 'react'
import { motion } from "framer-motion";
import { NavbarComponent } from '../../components.export'

interface PageLayoutProps {
    children: React.ReactNode
}

const Wrapper: React.FC<PageLayoutProps> = ({ children }) => {
    return (
        <div>
            <NavbarComponent />
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                    duration: 1.0,
                    ease: [0.22, 1, 0.36, 1]
                }}
            >
                {children}
            </motion.div>
        </div>
    )
}

export default Wrapper