import { MACHINES, type MachineId } from "@/lib/app-config"

const MACHINE_NAME_ALIASES: Partial<Record<MachineId, readonly string[]>> = {
  fly: ["플라이", "펙덱 플라이", "펙덱", "체스트 플라이", "버터플라이"],
  "chest-press": ["체스트프레스", "머신 체스트 프레스"],
  "incline-press": ["인클라인 체스트 프레스", "인클라인 머신 프레스"],
  "lat-pulldown": ["랫 풀다운", "랫풀", "lat pulldown"],
  "seated-row": ["시티드 케이블 로우", "케이블 로우", "seated row"],
  "assisted-pullup": ["어시스티드 풀업", "풀업 머신", "assisted pull up"],
  "shoulder-press": ["숄더프레스", "머신 숄더 프레스", "shoulder press"],
  "lateral-raise": ["레터럴 레이즈", "사이드 레터럴 레이즈", "lateral raise"],
  "side-lateral-raise": ["레터럴 레이즈", "사이드 레터럴 레이즈", "lateral raise"],
  "leg-extension": ["레그 익스텐션 머신", "leg extension"],
  "leg-curl": ["레그 컬 머신", "라잉 레그 컬", "시티드 레그 컬", "leg curl"],
  "front-squat": ["프런트 스쿼트", "front squat"],
  "preacher-curl": ["프리쳐 컬", "preacher curl"],
  "hammer-curl": ["hammer curl"],
  "cable-pushdown": ["푸시다운", "트라이셉스 푸시다운", "cable pushdown", "triceps pushdown"],
  "dip-machine": ["어시스티드 딥스", "딥스", "딥 머신", "assisted dips"],
}

function pushCandidate(target: Set<string>, value?: string | null) {
  if (!value) {
    return
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return
  }

  target.add(trimmed)

  if (trimmed.endsWith(" 머신")) {
    target.add(trimmed.replace(/\s*머신$/, ""))
  }
}

export function normalizeExerciseName(value: string) {
  return value.replace(/[^0-9A-Za-z가-힣]/g, "").toLowerCase()
}

export function getMachineNameCandidates(machineId?: string | null, machineName?: string | null) {
  const candidates = new Set<string>()
  const machine = machineId ? MACHINES.find((item) => item.id === machineId) : null

  if (machine) {
    pushCandidate(candidates, machine.name)

    for (const alias of MACHINE_NAME_ALIASES[machine.id] ?? []) {
      pushCandidate(candidates, alias)
    }
  }

  pushCandidate(candidates, machineName)

  return Array.from(candidates)
}

function getNormalizedMachineCandidates(machineId?: string | null, machineName?: string | null) {
  return getMachineNameCandidates(machineId, machineName).map(normalizeExerciseName)
}

export function findMachineByExerciseName(name: string) {
  const normalizedName = normalizeExerciseName(name)

  return MACHINES.find((machine) => getNormalizedMachineCandidates(machine.id, machine.name).includes(normalizedName)) ?? null
}
