import type { ReactNode } from 'react'

const PrintLayout = ({ children }: { children: ReactNode }) => (
  <div className="flex flex-1 flex-col bg-white text-black">{children}</div>
)

export default PrintLayout
