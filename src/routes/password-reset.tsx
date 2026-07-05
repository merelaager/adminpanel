import { createFileRoute, useSearch } from '@tanstack/react-router'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
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
import { AuthCard } from '@/components/AuthCard.tsx'
import { Route as loginRoute } from '@/routes/login.tsx'
import { resetPassword } from '@/requests/password-reset.ts'

const paramSchema = z
  .object({
    token: z.string().optional(),
  })
  .strict()

export const Route = createFileRoute('/password-reset')({
  component: RouteComponent,
  validateSearch: paramSchema,
})

const formSchema = z
  .object({
    password: z.string().min(6, {
      message: 'Salasõna peab olema vähemalt 6 tähemärki pikk.',
    }),
    passwordConfirmation: z.string().min(6, {
      message: 'Salasõna peab olema vähemalt 6 tähemärki pikk.',
    }),
    token: z.string().uuid(),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    path: ['passwordConfirmation'],
    message: 'Salasõnad ei klapi.',
  })

function RouteComponent() {
  const { token } = useSearch({ from: '/password-reset' })
  const navigate = Route.useNavigate()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: '',
      passwordConfirmation: '',
      token: token,
    },
  })

  const password = form.watch('password')
  const passwordConfirmation = form.watch('passwordConfirmation')
  const passwordsMatch =
    password && passwordConfirmation && password === passwordConfirmation

  const onFormSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await resetPassword(values.password, values.token)
      navigate({ to: loginRoute.to, replace: true })
    } catch (error) {
      toast.error('Viga salasõna lähtestamisel!', {
        description: (error as Error).message,
      })
    }
  }

  return (
    <AuthCard title="Lähtesta salasõna">
      <Form {...form}>
        <form
          className="flex flex-col gap-4"
          onSubmit={form.handleSubmit(onFormSubmit)}
        >
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
            name="passwordConfirmation"
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
          <FormField
            control={form.control}
            name="token"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pääsmik</FormLabel>
                <FormControl>
                  <Input {...field} disabled={!!token} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={!passwordsMatch}>
            Lähtesta salasõna
          </Button>
        </form>
      </Form>
    </AuthCard>
  )
}
