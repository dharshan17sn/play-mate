import React from 'react'

const base = 'inline-flex items-center justify-center rounded-md text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black disabled:opacity-50 disabled:pointer-events-none'
const variants = {
    default: 'bg-black text-white hover:bg-neutral-900',
    outline: 'border border-neutral-200 text-black hover:bg-neutral-100',
}

export function Button({ variant = 'default', className = '', asChild = false, children, ...props }) {
    const styles = `${base} ${variants[variant]} ${className} px-4 py-2`
    if (asChild && React.isValidElement(children)) {
        const childClass = children.props.className ? children.props.className + ' ' : ''
        return React.cloneElement(children, { className: childClass + styles, ...props })
    }
    return (
        <button className={styles} {...props}>
            {children}
        </button>
    )
}

export default Button


