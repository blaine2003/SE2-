"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/customer-components/ui/button"
import { Textarea } from "@/components/customer-components/ui/textarea"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/customer-components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/customer-components/ui/select"
import { Checkbox } from "@/components/customer-components/ui/checkbox"
import { useEffect, useState } from "react"

// Firebase imports
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"

const formSchema = z.object({
  carBrand: z.string().min(1, "Car brand is required"),
  carModel: z.string().min(1, "Car model is required"),
  yearModel: z.string().min(1, "Year model is required"),
  transmission: z.string().min(1, "Transmission is required"),
  fuelType: z.string().min(1, "Fuel type is required"),
  odometer: z.string().min(1, "Odometer reading is required"),
  generalServices: z.array(z.string()).min(1, "At least one service must be selected"),
  specificIssues: z.string().max(1000, "Description must not exceed 1000 characters"),
})

// Sample data structure - to be replaced with Firebase data
const carData: Record<string, string[]> = {
Toyota: ["Vios", "Corolla", "Camry", "Fortuner", "Innova", "Hilux", "Land Cruiser", "Supra", "Yaris", "Rush", 
    "Avanza", "Raize", "Tundra", "Tacoma", "4Runner", "Sequoia", "Sienna", "C-HR", "GR86", "GR Yaris", "Crown"],
Honda: ["Civic", "BRV", "CRV", "City", "Accord", "Jazz", "HRV", "Pilot", "Odyssey", "Fit", "Freed", "Insight", 
   "Legend", "Passport", "Ridgeline", "S2000", "e", "Stepwgn", "ZR-V", "Clarity", "Integra"],
Nissan: ["Almera", "Altima", "GT-R", "370Z", "Navara", "Patrol", "Terra", "X-Trail", "Juke", "Sylphy", "Teana", 
    "Titan", "Murano", "Rogue", "Kicks", "Frontier", "Pathfinder", "Ariya", "Leaf", "Note", "Fairlady Z"],
Mazda: ["Mazda2", "Mazda3", "Mazda6", "CX-3", "CX-5", "CX-9", "BT-50", "MX-5", "CX-30", "CX-60", "CX-90", 
   "CX-50", "RX-8", "RX-7", "Eunos Cosmo", "Bongo", "Flair", "Scrum", "Roadster"],
Mitsubishi: ["Mirage", "Lancer", "Xpander", "Montero Sport", "Pajero", "Strada", "Outlander", "Eclipse Cross", 
        "Delica", "ASX", "RVR", "i-MiEV", "Triton", "Galant", "Attrage", "Minicab", "Toppo"],
Subaru: ["Impreza", "WRX", "Forester", "Outback", "XV", "BRZ", "Legacy", "Levorg", "Ascent", "Crosstrek", "Solterra", 
    "Baja", "Justy", "Tribeca", "Sambar"],
Suzuki: ["Swift", "Ertiga", "Celerio", "Vitara", "Jimny", "XL7", "Dzire", "Baleno", "Ignis", "Alto", "Wagon R", 
    "S-Presso", "Carry", "Every", "Spacia", "Lapin", "Ciaz", "Grand Vitara"],
Isuzu: ["D-Max", "MU-X", "Crosswind", "Trooper", "Panther", "VehiCROSS", "Fargo", "Giga", "Bighorn", "Elf", 
   "Rodeo", "Axiom", "Ascender", "Amigo"],
Daihatsu: ["Terios", "Hijet", "Move", "Mira", "Copen", "Rocky", "Atrai", "Tanto", "Thor", "Wake", "Boon", 
      "Cast", "Sonica", "Materia"],
Lexus: ["IS", "ES", "GS", "LS", "NX", "RX", "GX", "LX", "LC", "UX", "RC", "LM", "LBX", "RZ", "SC", "HS", "CT"]
}

const transmissionTypes = ["Automatic", "Manual"]
const fuelTypes = ["Gas", "Diesel", "Electric"]
const odometerRanges = ["0km - 50,000km", "50,000km - 150,000km", "150,000km - 250,000km", "250,000km+"]
const services = [
  { id: "PAINT JOBS", label: "Paint Jobs" },
  { id: "BRAKE SHOES CLEAN", label: "Brake Shoes Clean" },
  { id: "ENGINE OVERHAUL", label: "Engine Overhaul" },
  { id: "SUSPENSION SYSTEMS", label: "Suspension Systems" },
  { id: "BRAKE SHOES REPLACE", label: "Brake Shoes Replace" },
  { id: "BRAKE CLEAN", label: "Brake Clean" },
  { id: "ENGINE TUNING", label: "Engine Tuning" },
  { id: "AIR CONDITIONING", label: "Air Conditioning" },
  { id: "BRAKE REPLACE", label: "Brake Replace" },
  { id: "OIL CHANGE", label: "Oil Change" },
]

interface CarDetailsFormProps {
  initialData: any
  onSubmit: (data: any) => void
  onBack: () => void
}

export function CarDetailsForm({ initialData, onSubmit, onBack }: CarDetailsFormProps) {
  const [carBrands, setCarBrands] = useState<string[]>(Object.keys(carData))
  const [availableModels, setAvailableModels] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      carBrand: initialData?.carBrand || "",
      carModel: initialData?.carModel || "",
      yearModel: initialData?.yearModel || "",
      transmission: initialData?.transmission || "",
      fuelType: initialData?.fuelType || "",
      odometer: initialData?.odometer || "",
      generalServices: initialData?.generalServices || [],
      specificIssues: initialData?.specificIssues || "",
    },
  })

  const selectedBrand = form.watch("carBrand")
  const specificIssues = form.watch("specificIssues")
  const characterCount = specificIssues?.length || 0

  // Update available models when brand changes
  useEffect(() => {
    if (selectedBrand) {
      // Update available models based on the selected brand
      setAvailableModels(carData[selectedBrand] || []);
      
      // Keep the selected model if it exists in the new brand's models
      if (!carData[selectedBrand]?.includes(form.getValues("carModel"))) {
        form.setValue("carModel", ""); // Reset only if the previous model is not in the new list
      }
    }
  }, [selectedBrand, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="carBrand"
            render={({ field }) => (
              <FormItem>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-white/50">
                      <SelectValue placeholder="Car Brand" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {loading ? (
                      <SelectItem value="loading" disabled>
                        Loading...
                      </SelectItem>
                    ) : (
                      carBrands.map((brand) => (
                        <SelectItem key={brand} value={brand}>
                          {brand}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="carModel"
            render={({ field }) => (
              <FormItem>
                <Select onValueChange={field.onChange} value={field.value} disabled={!selectedBrand}>
                  <FormControl>
                    <SelectTrigger className="bg-white/50">
                      <SelectValue placeholder="Car Model" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {loading ? (
                      <SelectItem value="loading" disabled>
                        Loading...
                      </SelectItem>
                    ) : availableModels.length > 0 ? (
                      availableModels.map((model) => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-models" disabled>
                        {selectedBrand ? "No models available" : "Select a brand first"}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="yearModel"
            render={({ field }) => (
              <FormItem>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-white/50">
                      <SelectValue placeholder="Year Model" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                  {Array.from({ length: new Date().getFullYear() - 1949 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="transmission"
            render={({ field }) => (
              <FormItem>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-white/50">
                      <SelectValue placeholder="Transmission" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {transmissionTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="fuelType"
            render={({ field }) => (
              <FormItem>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-white/50">
                      <SelectValue placeholder="Fuel Type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {fuelTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="odometer"
            render={({ field }) => (
              <FormItem>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-white/50">
                      <SelectValue placeholder="Odometer" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {odometerRanges.map((range) => (
                      <SelectItem key={range} value={range}>
                        {range}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="generalServices"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <label className="text-sm font-medium">General Services</label>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {services.map((service) => (
                  <FormField
                    key={service.id}
                    control={form.control}
                    name="generalServices"
                    render={({ field }) => {
                      return (
                        <FormItem key={service.id} className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(service.id)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...field.value, service.id])
                                  : field.onChange(field.value?.filter((value: string) => value !== service.id))
                              }}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                              {service.label}
                            </label>
                          </div>
                        </FormItem>
                      )
                    }}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="specificIssues"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <div className="relative">
                  <Textarea
                    placeholder="For specific issue/s, kindly describe in detail..."
                    className="min-h-[100px] bg-white/50 resize-none"
                    maxLength={1000}
                    {...field}
                  />
                  <div className="absolute bottom-2 right-2 text-xs text-gray-400">{characterCount}/1000</div>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={onBack} className="border-[#1e4e8c] text-[#1e4e8c]">
            Back
          </Button>
          <Button type="submit" className="bg-[#1e4e8c] text-white">
            Proceed
          </Button>
        </div>
      </form>
    </Form>
  )
}

