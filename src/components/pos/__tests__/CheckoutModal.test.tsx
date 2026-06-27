import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CheckoutModal } from "../CheckoutModal";
import * as CartContext from "../../../context/CartContext";

// Mock the cart context
vi.mock("../../../context/CartContext", () => ({
  useCart: vi.fn(),
}));

describe("CheckoutModal", () => {
  const mockOnClose = vi.fn();
  const mockOnComplete = vi.fn().mockResolvedValue(undefined);

  const defaultProps = {
    open: true,
    onClose: mockOnClose,
    onComplete: mockOnComplete,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Default cart state
    vi.mocked(CartContext.useCart).mockReturnValue({
      items: [],
      addItem: vi.fn(),
      removeItem: vi.fn(),
      updateQuantity: vi.fn(),
      clearCart: vi.fn(),
      itemCount: 0,
      subtotal: 150.50,
      discount: 0,
      setDiscount: vi.fn(),
      total: 150.50, // Default total for tests
    });
  });

  it("renders correctly with total amount due", () => {
    render(<CheckoutModal {...defaultProps} />);
    
    expect(screen.getByText("Checkout")).toBeInTheDocument();
    expect(screen.getByText("Total Amount Due")).toBeInTheDocument();
    // 150.50 should be formatted.
    expect(screen.getByText(/150\.50/)).toBeInTheDocument();
  });

  it("initializes amount received with the exact total", () => {
    render(<CheckoutModal {...defaultProps} />);
    
    const input = screen.getByLabelText("Amount Received") as HTMLInputElement;
    expect(input.value).toBe("150.50");
  });

  it("disables Complete Sale button if amount paid is less than total", () => {
    render(<CheckoutModal {...defaultProps} />);
    
    const input = screen.getByLabelText("Amount Received");
    fireEvent.change(input, { target: { value: "100.00" } });
    
    const completeButton = screen.getByRole("button", { name: "Complete Sale" });
    expect(completeButton).toBeDisabled();
    
    expect(screen.getByText("Remaining Balance")).toBeInTheDocument();
  });

  it("enables Complete Sale button and calculates change if amount paid >= total", () => {
    render(<CheckoutModal {...defaultProps} />);
    
    const input = screen.getByLabelText("Amount Received");
    fireEvent.change(input, { target: { value: "200.00" } });
    
    const completeButton = screen.getByRole("button", { name: "Complete Sale" });
    expect(completeButton).not.toBeDisabled();
    
    expect(screen.getByText("Change Due")).toBeInTheDocument();
    expect(screen.getByText(/49\.50/)).toBeInTheDocument();
  });

  it("prevents invalid input characters", () => {
    render(<CheckoutModal {...defaultProps} />);
    
    const input = screen.getByLabelText("Amount Received") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "abc" } });
    
    // Value should remain unchanged (150.50) because the hook rejects "abc"
    expect(input.value).toBe("150.50");
  });

  it("calls onComplete with the parsed paid amount when submitted", async () => {
    render(<CheckoutModal {...defaultProps} />);
    
    const completeButton = screen.getByRole("button", { name: "Complete Sale" });
    fireEvent.click(completeButton);
    
    await waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalledWith(150.5);
    });
  });

  it("displays loading state correctly", () => {
    render(<CheckoutModal {...defaultProps} loading={true} />);
    
    expect(screen.getByRole("button", { name: "Processing..." })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
  });

  it("displays error message if provided", () => {
    render(<CheckoutModal {...defaultProps} error="Transaction failed" />);
    expect(screen.getByText("Transaction failed")).toBeInTheDocument();
  });

  it("quick cash buttons update the amount received", () => {
    render(<CheckoutModal {...defaultProps} />);
    
    // Quick cash options for 150.50 should include 200, 500, 1000
    const button200 = screen.getByRole("button", { name: /Pay .*200/ });
    fireEvent.click(button200);
    
    const input = screen.getByLabelText("Amount Received") as HTMLInputElement;
    expect(input.value).toBe("200.00");
  });
});
