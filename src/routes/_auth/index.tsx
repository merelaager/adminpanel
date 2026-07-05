import { Link, createFileRoute } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

import { useSuspenseQuery } from '@tanstack/react-query'
import { CircleAlertIcon } from 'lucide-react'
import { toast } from 'sonner'
import type {
  ShiftStaffMember,
  StaffCertificate,
} from '@/requests/shift-staff.ts'
import { requireUser, useUser } from '@/stores/authStore.ts'
import { isAdminRole } from '@/lib/roles.ts'

import { shiftStaffFetchQueryOptions } from '@/requests/shift-staff.ts'
import { Separator } from '@/components/ui/separator.tsx'
import { Badge } from '@/components/ui/badge.tsx'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form.tsx'
import { Input } from '@/components/ui/input.tsx'
import { Button } from '@/components/ui/button.tsx'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.tsx'
import { changePassword, sendInvite } from '@/requests/user.ts'

export const Route = createFileRoute('/_auth/')({
  component: App,
  loader: ({ context: { queryClient } }) => {
    const shiftNr = requireUser().currentShift
    queryClient.ensureQueryData(shiftStaffFetchQueryOptions(shiftNr))
  },
})

const MissingCertificateTooltip = () => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="outline">
          <CircleAlertIcon />
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        <p>Puudub kehtiv tunnistus!</p>
      </TooltipContent>
    </Tooltip>
  )
}

type ActiveCertificatesProps = {
  certificates: Array<StaffCertificate>
}

const ActiveCertificates = ({ certificates }: ActiveCertificatesProps) => {
  const urlPrefix = 'https://www.kutseregister.ee/ctrl/et/Tunnistused/vaata/'

  return (
    <div>
      {certificates.map((certificate) => (
        <Tooltip key={certificate.certId}>
          <TooltipTrigger asChild>
            <Badge variant="outline">
              {certificate.certId.startsWith('__') ? (
                'NST'
              ) : (
                <Link to={urlPrefix + certificate.urlId} target="_blank">
                  {certificate.certId}
                </Link>
              )}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>{certificate.name}</p>
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  )
}

type TeamCardEntryProps = {
  member: ShiftStaffMember
}

const TeamCardEntry = ({ member }: TeamCardEntryProps) => {
  let displayCertificateWarning = false

  if (member.role === 'boss' || member.role === 'full') {
    if (member.certificates.length === 0) displayCertificateWarning = true
  }

  const roles: { [key: string]: string } = {
    boss: 'Juhataja',
    full: 'Kasvataja',
    part: 'Abikasvataja',
    guest: 'Suvitaja',
  }
  const displayRole = roles[member.role]

  return (
    <div key={member.id}>
      <div>{member.name}</div>
      <div className="flex gap-2 items-center">
        <div className="text-sm">{displayRole}</div>
        {displayCertificateWarning ? (
          <MissingCertificateTooltip />
        ) : (
          <ActiveCertificates certificates={member.certificates} />
        )}
      </div>
    </div>
  )
}

type TeamCardProps = {
  staff: Array<ShiftStaffMember>
}

const TeamCard = ({ staff }: TeamCardProps) => {
  return (
    <div className="border rounded-md p-6">
      <div>Meeskond</div>
      <Separator className="my-4" />
      <div className="flex flex-col gap-4">
        {staff.map((member) => (
          <TeamCardEntry key={member.id} member={member} />
        ))}
      </div>
    </div>
  )
}

const formSchema = z.object({
  name: z
    .string()
    .trim()
    .refine((val) => val.split(/\s+/).length >= 2, {
      message: 'Nimi peab koosnema vähemalt kahest osast.',
    }),
  email: z.string().email({
    message: 'Peab olema meiliaadress.',
  }),
  role: z.string(),
})

const changePasswordFormSchema = z.object({
  currentPassword: z.string().min(1, {
    message: 'Praegune salasõna on kohustuslik!',
  }),
  password: z.string().min(6, {
    message: 'Salasõna peab olema vähemat 6 tähemärki pikk!',
  }),
  confirmPassword: z.string(),
})

const ChangePasswordCard = () => {
  const form = useForm<z.infer<typeof changePasswordFormSchema>>({
    resolver: zodResolver(changePasswordFormSchema),
    defaultValues: {
      currentPassword: '',
      password: '',
      confirmPassword: '',
    },
  })

  const onFormSubmit = async (
    values: z.infer<typeof changePasswordFormSchema>,
  ) => {
    if (values.password !== values.confirmPassword) {
      toast.warning('Salasõnad peavad klappima!')
      return
    }

    try {
      await changePassword(
        values.currentPassword.trim(),
        values.password.trim(),
      )

      toast.message('Salasõna muudetud!')
    } catch (error) {
      toast.error('Viga salasõna muutmisel!', {
        description: (error as Error).message,
      })
    }
  }

  return (
    <div className="border rounded-md p-6 max-w-sm">
      <div>Muuda salasõna</div>
      <Separator className="my-4" />
      <Form {...form}>
        <form
          className="flex flex-col gap-4"
          onSubmit={form.handleSubmit(onFormSubmit)}
        >
          <FormField
            control={form.control}
            name="currentPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Praegune salasõna</FormLabel>
                <FormControl>
                  <Input {...field} type="password" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Salasõna</FormLabel>
                <FormControl>
                  <Input {...field} type="password" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Salasõna uuesti</FormLabel>
                <FormControl>
                  <Input {...field} type="password" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit">Uuenda salasõna</Button>
        </form>
      </Form>
    </div>
  )
}

const InviteCard = () => {
  const shiftNr = useUser().currentShift

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      name: '',
      role: '',
    },
  })

  const roleMap = {
    instructor: 'Kasvataja',
    helper: 'Abikasvataja',
  }

  const onFormSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await sendInvite({
        name: values.name.trim(),
        email: values.email.trim(),
        role: values.role,
        shiftNr,
      })

      toast.message('Kutse saadetud!')
    } catch (error) {
      toast.error('Viga konto loomisel!', {
        description: (error as Error).message,
      })
    }
  }

  return (
    <div className="border rounded-md p-6 max-w-sm">
      <div>Lisa liige</div>
      <Separator className="my-4" />
      <Form {...form}>
        <form
          className="flex flex-col gap-4"
          onSubmit={form.handleSubmit(onFormSubmit)}
        >
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nimi</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Kotermann Haldjas" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Meiliaadress</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="kotermann@merelaager.ee" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Roll</FormLabel>
                <Select onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Vali roll" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.keys(roleMap).map((key) => (
                      <SelectItem key={key} value={key}>
                        {roleMap[key as keyof typeof roleMap]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit">Saada kutse</Button>
        </form>
      </Form>
    </div>
  )
}

function App() {
  const user = useUser()
  const shiftNr = user.currentShift
  const currentRole = user.currentRole

  const canInvite = isAdminRole(currentRole)

  const { data: staff } = useSuspenseQuery(shiftStaffFetchQueryOptions(shiftNr))

  return (
    <div className="px-6 pb-6 flex flex-col gap-6 overflow-y-scroll h-[calc((100%-var(--spacing)*16))]">
      <div>Kambüüs on veel töös</div>
      <TeamCard staff={staff} />
      {canInvite && <InviteCard />}
      <ChangePasswordCard />
    </div>
  )
}
