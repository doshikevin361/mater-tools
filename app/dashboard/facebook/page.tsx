"use client"

import React from "react"
import { useSMMService } from "@/hooks/use-smm-service"
import { SMMMessageUI } from "@/components/smm-message-ui"

export default function FacebookPage() {
  const smmService = useSMMService({ platform: "facebook" })

  const handleCategorySelect = (categoryId: string) => {
    if (categoryId) {
      smmService.filterServicesByCategory(categoryId)
    } else {
      smmService.resetSelection()
    }
  }

  const handleServiceSelect = (service: any) => {
    // Service selection is handled within the SMMMessageUI component
    console.log("Service selected:", service)
  }

  return (
    <div className="container mx-auto py-6">
      <SMMMessageUI
        platform="facebook"
        categories={smmService.categories}
        filteredServices={smmService.filteredServices}
        selectedCategory={smmService.selectedCategory}
        loading={smmService.loading}
        refreshing={smmService.refreshing}
        onCategorySelect={handleCategorySelect}
        onServiceSelect={handleServiceSelect}
        onCreateOrder={smmService.createOrder}
        calculateCost={smmService.calculateCost}
        getEstimatedDelivery={smmService.getEstimatedDelivery}
        onRefresh={smmService.refreshServices}
      />
    </div>
  )
}
