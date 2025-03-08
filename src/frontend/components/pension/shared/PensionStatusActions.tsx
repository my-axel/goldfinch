"use client"

/**
 * PensionStatusActions Component
 * 
 * This component displays the current status of a pension (Active/Paused) and
 * provides a button to toggle between these states. It's designed to be used
 * in the headerActions prop of the FormSection component.
 * 
 * Usage:
 * 1. Import the component:
 *    import { PensionStatusActions } from "@/frontend/components/pension/shared/PensionStatusActions"
 * 
 * 2. Use it in a FormSection's headerActions prop
 * 
 * 3. Implement dialog handling in your page component:
 *    - Add state variables for dialog visibility
 *    - Add handler functions for confirming pause/resume actions
 *    - Render the dialog components at the bottom of your component
 * 
 * Note: This component doesn't handle the actual status change logic - it only
 * triggers the callbacks that should open the appropriate dialogs. The actual
 * status update should be handled by the parent component.
 * 
 * See the example in the component documentation below.
 */

import { Badge } from "@/frontend/components/ui/badge"
import { Button } from "@/frontend/components/ui/button"
import { PauseCircle, PlayCircle } from "lucide-react"

interface PensionStatusActionsProps {
  /**
   * The current status of the pension
   * This should be either 'ACTIVE' or 'PAUSED' as defined in the Pension type
   */
  status: 'ACTIVE' | 'PAUSED';
  
  /**
   * Callback function when the pause button is clicked
   * Typically used to open a confirmation dialog
   * Example: () => setShowPauseDialog(true)
   */
  onPause: () => void;
  
  /**
   * Callback function when the resume button is clicked
   * Typically used to open a date selection dialog
   * Example: () => setShowResumeDialog(true)
   */
  onResume: () => void;
}

/**
 * PensionStatusActions component
 * 
 * @param status - Current pension status ('ACTIVE' or 'PAUSED')
 * @param onPause - Function to call when the pause button is clicked
 * @param onResume - Function to call when the resume button is clicked
 * 
 * @example
 * // Basic usage
 * <PensionStatusActions
 *   status={pension.status}
 *   onPause={() => setShowPauseDialog(true)}
 *   onResume={() => setShowResumeDialog(true)}
 * />
 * 
 * @example
 * // Complete implementation example:
 * 
 * // 1. Add state variables for dialogs
 * const [showPauseDialog, setShowPauseDialog] = useState(false)
 * const [showResumeDialog, setShowResumeDialog] = useState(false)
 * 
 * // 2. Add handler functions
 * const handlePauseConfirm = async (pauseDate: Date) => {
 *   await updatePensionStatus(pensionId, {
 *     status: 'PAUSED',
 *     paused_at: pauseDate.toISOString(),
 *   })
 *   setShowPauseDialog(false)
 * }
 * 
 * const handleResumeConfirm = async (resumeDate: Date) => {
 *   await updatePensionStatus(pensionId, {
 *     status: 'ACTIVE',
 *     resume_at: resumeDate.toISOString(),
 *   })
 *   setShowResumeDialog(false)
 * }
 * 
 * // 3. Use in FormSection and render dialogs
 * // See app/pension/insurance/[id]/edit/page.tsx for a complete example
 */
export function PensionStatusActions({ 
  status, 
  onPause, 
  onResume 
}: PensionStatusActionsProps) {
  return (
    <div className="flex items-center gap-3">
      {/* Status badge - shows current pension status */}
      <Badge variant={status === 'ACTIVE' ? 'default' : 'secondary'}>
        {status === 'ACTIVE' ? 'Active' : 'Paused'}
      </Badge>
      
      {/* Toggle button - changes based on current status */}
      <Button
        variant="outline"
        size="sm"
        type="button"
        onClick={() => {
          // Call the appropriate callback based on current status
          if (status === 'ACTIVE') {
            onPause();
          } else {
            onResume();
          }
        }}
      >
        {/* Show different icon and text based on current status */}
        {status === 'ACTIVE' ? (
          <>
            <PauseCircle className="h-4 w-4 mr-2" />
            Pause
          </>
        ) : (
          <>
            <PlayCircle className="h-4 w-4 mr-2" />
            Resume
          </>
        )}
      </Button>
    </div>
  );
} 