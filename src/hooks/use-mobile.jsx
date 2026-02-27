import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  // no TypeScript type annotations
  const [isMobile, setIsMobile] = React.useState(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)

    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }

    // set initial value
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)

    // subscribe to changes
    mql.addEventListener("change", onChange)

    return () => {
      mql.removeEventListener("change", onChange)
    }
  }, [])

  // always return a boolean
  return !!isMobile
}
