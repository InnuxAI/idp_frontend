"use client"

import React from "react"
import { DynamicJsonRenderer } from "@/components/ui/dynamic-json-renderer"

// Example data to demonstrate different rendering scenarios
const exampleData = {
  // Simple fields
  po_number: "PO-2024-001",
  po_date: "2024-09-04",
  vendor_email: "vendor@technocorp.com",
  vendor_website: "https://www.technocorp.com",
  total_amount: 1250.75,
  approved: true,
  
  // Nested object
  billing_address: {
    street: "123 Business Ave",
    city: "Tech City",
    state: "CA",
    zip_code: "90210",
    country: "USA"
  },
  
  // Array of objects (will render as table)
  line_items: [
    {
      item_no: "ITM-001",
      description: "Safety Cutting Blades - 3.0 mm Edge",
      quantity: 10,
      unit_price: 15.00,
      total: 150.00
    },
    {
      item_no: "ITM-002", 
      description: "Industrial Work Gloves - Kevlar Coated",
      quantity: 20,
      unit_price: 7.50,
      total: 150.00
    },
    {
      item_no: "ITM-003",
      description: "Safety Helmets - ANSI Certified",
      quantity: 5,
      unit_price: 45.00,
      total: 225.00
    }
  ],
  
  // Simple array
  categories: ["Safety Equipment", "Industrial Supplies", "PPE"],
  
  // Nested complex structure
  shipping_details: {
    method: "Express Delivery",
    carrier: "FastShip Inc",
    tracking_numbers: ["FS123456789", "FS987654321"],
    estimated_delivery: "2024-09-06",
    special_instructions: "Handle with care - fragile items"
  }
}

// Example of array of objects at root level
const tableData = [
  {
    "#": 1,
    "Item Description": "Safety Cutting Blades - 3.0 mm Edge", 
    "Quantity": 10,
    "Unit Price": "$15.00",
    "Total": "$150.00",
    "Category": "Safety Equipment"
  },
  {
    "#": 2,
    "Item Description": "Industrial Work Gloves - Kevlar Coated",
    "Quantity": 20, 
    "Unit Price": "$7.50",
    "Total": "$150.00",
    "Category": "PPE"
  },
  {
    "#": 3,
    "Item Description": "Safety Helmets - ANSI Certified",
    "Quantity": 5,
    "Unit Price": "$45.00", 
    "Total": "$225.00",
    "Category": "Safety Equipment"
  }
]

export default function DynamicJsonRendererDemo() {
  // Example data with JSON strings (simulating backend response)
  const jsonStringData = {
    po_no: "PO-20250701-001",
    po_date: "2025-07-01",
    line_items: JSON.stringify([
      {"#": 1, "Item Description": "Safety Cutting Blade", "Price": "$12.99"},
      {"#": 2, "Item Description": "Protective Gloves", "Price": "$8.50"},
      {"#": 3, "Item Description": "Safety Goggles", "Price": "$15.75"}
    ]), // This simulates a JSON string coming from backend
    supplier_info: JSON.stringify({
      name: "Safety Equipment Co.",
      address: "123 Safety St",
      phone: "555-0123"
    }),
    total_amount: 37.24
  }

  // Example data with Python string representations (actual backend format)
  const pythonStringData = {
    po_no: "PO-20250701-001",
    po_date: "2025-07-01",
    line_items: "[{'#': 1, 'Item Description': 'Safety Cutting Blades - 3.0 mm Edge', 'Quantity': 10, 'Unit Price': '$15.00', 'Total': '$150.00'}, {'#': 2, 'Item Description': 'Industrial Work Gloves - Kevlar Coated', 'Quantity': 20, 'Unit Price': '$7.50', 'Total': '$150.00'}]", // Python string format
    supplier_info: "{'name': 'Abatix Corporation', 'contact': 'John Doe', 'approved': True}",
    total_amount: 300.00
  }

  return (
    <div className="space-y-8 p-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Dynamic JSON Renderer Demo</h2>
        <p className="text-muted-foreground mb-6">
          This component automatically detects data types and renders them appropriately:
          tables for arrays of objects, nested cards for objects, and formatted values for primitives.
          It also automatically parses JSON strings AND Python string representations from the backend.
        </p>
      </div>
      
      {/* Complex nested object */}
      <DynamicJsonRenderer 
        data={exampleData}
        title="Purchase Order Data"
        className="max-w-4xl"
      />
      
      {/* Array of objects (table format) */}
      <DynamicJsonRenderer 
        data={tableData}
        title="Line Items Table"
        className="max-w-4xl"
      />
      
      {/* JSON String parsing example */}
      <div>
        <h3 className="text-lg font-semibold mb-2">JSON String Parsing Demo</h3>
        <p className="text-sm text-muted-foreground mb-4">
          This example shows JSON strings being automatically parsed and rendered as tables/objects
        </p>
        <DynamicJsonRenderer 
          data={jsonStringData}
          title="Extracted Data (with JSON Strings)"
          className="max-w-4xl"
        />
      </div>
      
      {/* Python String parsing example */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Python String Parsing Demo (Real Backend Format)</h3>
        <p className="text-sm text-muted-foreground mb-4">
          This example shows Python string representations (like from your backend) being parsed automatically
        </p>
        <DynamicJsonRenderer 
          data={pythonStringData}
          title="Extracted Data (Python String Format)"
          className="max-w-4xl"
        />
      </div>
      
      {/* Simple object */}
      <DynamicJsonRenderer 
        data={{
          customer_name: "Acme Corporation",
          phone: "+1-555-123-4567", 
          priority: "High",
          rush_order: true
        }}
        title="Customer Information"
        className="max-w-md"
      />
    </div>
  )
}
