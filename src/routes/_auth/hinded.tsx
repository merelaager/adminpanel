import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/table-core'

import { getUserShift } from '@/utils.ts'

import { shiftTentsFetchQueryOptions } from '@/requests/tents.ts'

import { DataTable } from '@/components/data-table.tsx'

type DisplayTentScore = {
  score: number
  tentNr: number
  createdAt: string
}

export const Route = createFileRoute('/_auth/hinded')({
  component: RouteComponent,
  loader: ({ context: { queryClient } }) => {
    queryClient.ensureQueryData(shiftTentsFetchQueryOptions(getUserShift()))
  },
})

const scoreColumns: ColumnDef<DisplayTentScore[]>[] = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
].map((tentNr) => {
  return {
    header: `${tentNr}`,
    cell: ({ row }) => {
      let relevantEntry = Array.from(row.original.values()).find(
        (e) => e.tentNr === tentNr,
      )
      if (relevantEntry) return relevantEntry.score.toFixed(1)
      return '-'
    },
  }
})

const scoreTableColumns: ColumnDef<DisplayTentScore[]>[] = [
  {
    header: 'Kuupäev',
    cell: ({ row }) => {
      return Array.from(row.original.values())[0].createdAt
    },
  },
  ...scoreColumns,
]

function RouteComponent() {
  const shiftNr = getUserShift()

  const { data: scores } = useSuspenseQuery(
    shiftTentsFetchQueryOptions(shiftNr),
  )

  const dateScores = new Map<string, DisplayTentScore[]>()

  // Split scores by date.
  scores?.forEach((score) => {
    const dateString = new Date(score.createdAt).toLocaleDateString('et')
    const entries = dateScores.get(dateString)
    if (entries === undefined) {
      dateScores.set(dateString, [score])
      return
    }
    entries.push(score)
  })

  const summedScores: number[] = []
  for (let i = 1; i <= 10; ++i) summedScores.push(0)

  // Keep only a single score per tent per calendar day.
  // Average multiple values for the same day.
  const uniqueDateScores = new Map<string, DisplayTentScore[]>()
  dateScores.forEach((tentInfo, dateString) => {
    if (tentInfo.length === 0) {
      uniqueDateScores.set(dateString, [])
      return
    }

    const dateScores: DisplayTentScore[] = []
    for (let i = 1; i <= 10; ++i) {
      let totalCount = 0
      let totalScore = 0
      tentInfo.forEach((tent) => {
        if (tent.tentNr === i) {
          totalCount += 1
          totalScore += tent.score
        }
      })

      const dailyScore = totalScore / totalCount

      if (totalCount > 0) {
        dateScores.push({
          score: dailyScore,
          tentNr: i,
          createdAt: dateString,
        })
      }

      if (!isNaN(dailyScore)) summedScores[i - 1] += dailyScore
    }

    uniqueDateScores.set(dateString, dateScores)
  })

  const averages: DisplayTentScore[] = []
  for (let i = 0; i < 10; ++i) {
    averages.push({
      score: summedScores[i] / uniqueDateScores.size,
      tentNr: i + 1,
      createdAt: 'Keskmine',
    })
  }
  uniqueDateScores.set('Keskmine', averages)

  return (
    <div className="px-6 pb-6 flex flex-col gap-6 overflow-y-scroll h-[calc((100%-var(--spacing)*16))]">
      <DataTable
        columns={scoreTableColumns}
        data={Array.from(uniqueDateScores.values())}
      />
      <p>
        Kui ühel kuupäeval on telgile antud rohkem kui üks hinne, siis on
        tabelis kuvatud selle päeva telgi hinnete keskmine.
      </p>
    </div>
  )
}
