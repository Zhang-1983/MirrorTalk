import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 开始播种数据...')

  // 创建剧本数据
  const scenarios = [
    {
      title: '绩效面谈：低绩效员工',
      description: '您需要与一位连续两个季度绩效不达标的员工进行绩效面谈，帮助他改进工作表现。',
      category: 'PERFORMANCE',
      difficulty: 'INTERMEDIATE',
      background: JSON.stringify({
        context: '该员工是技术团队成员，入职2年，之前表现良好，但最近两个季度绩效下滑明显。',
        employeeProfile: {
          name: '李明',
          position: '前端开发工程师',
          tenure: '2年',
          previousPerformance: '良好',
          recentIssues: ['项目延期', '代码质量下降', '团队协作减少']
        }
      }),
      aiCharacter: JSON.stringify({
        name: '李明',
        personality: '内向、敏感、有一定自尊心，最近因家庭原因情绪低落',
        emotionalTriggers: ['批评', '比较', '威胁'],
        behaviorGuidelines: [
          '对批评会有防御性反应',
          '可能会回避问题',
          '需要被理解和支持',
          '可能会提到个人困难'
        ]
      }),
      evaluationDimensions: JSON.stringify([
        { name: '同理心', description: '能否理解员工处境，给予适当关怀', weight: 0.25 },
        { name: '表达清晰度', description: '能否清晰表达绩效问题和期望', weight: 0.2 },
        { name: '倾听能力', description: '能否耐心倾听员工解释', weight: 0.2 },
        { name: '问题解决', description: '能否共同制定改进计划', weight: 0.2 },
        { name: '情绪管理', description: '能否控制自己情绪，引导对话', weight: 0.15 }
      ]),
      estimatedDuration: 15
    },
    {
      title: '辞退沟通：试用期不合格',
      description: '您需要通知一位试用期员工，因表现不合格公司决定不予转正。',
      category: 'TERMINATION',
      difficulty: 'ADVANCED',
      background: JSON.stringify({
        context: '该员工入职3个月，试用期即将结束。经过评估，其能力和态度均不符合岗位要求。',
        employeeProfile: {
          name: '张华',
          position: '销售代表',
          tenure: '3个月',
          issues: ['业绩不达标', '客户投诉', '团队融入困难']
        }
      }),
      aiCharacter: JSON.stringify({
        name: '张华',
        personality: '外向、有野心、对工作有期待，可能会情绪激动',
        emotionalTriggers: ['否定', '拒绝', '不公平感'],
        behaviorGuidelines: [
          '可能会质疑评估结果',
          '可能会请求再给一次机会',
          '可能会情绪激动或哭泣',
          '可能会提到自己的努力'
        ]
      }),
      evaluationDimensions: JSON.stringify([
        { name: '同理心', description: '能否体谅员工感受', weight: 0.2 },
        { name: '表达清晰度', description: '能否清晰说明决定和原因', weight: 0.25 },
        { name: '倾听能力', description: '能否耐心倾听员工诉求', weight: 0.15 },
        { name: '问题解决', description: '能否妥善处理后续事宜', weight: 0.2 },
        { name: '情绪管理', description: '能否保持冷静应对各种反应', weight: 0.2 }
      ]),
      estimatedDuration: 20
    },
    {
      title: '冲突调解：团队成员矛盾',
      description: '两位团队成员因工作方式不同产生矛盾，影响团队协作，您需要介入调解。',
      category: 'CONFLICT',
      difficulty: 'INTERMEDIATE',
      background: JSON.stringify({
        context: '产品经理和开发工程师因需求变更频繁发生争执，已影响项目进度。',
        employeeProfile: {
          name: '王芳',
          position: '产品经理',
          tenure: '1年',
          perspective: '需求变更是业务需要，开发应该配合'
        },
        otherParty: {
          name: '陈强',
          position: '后端开发工程师',
          perspective: '频繁变更影响代码质量，产品应该想清楚'
        }
      }),
      aiCharacter: JSON.stringify({
        name: '王芳',
        personality: '强势、目标导向、注重效率',
        emotionalTriggers: ['被质疑专业性', '被指责'],
        behaviorGuidelines: [
          '会强调业务压力',
          '可能会指责开发不配合',
          '需要被认可专业性',
          '愿意妥协但需要面子'
        ]
      }),
      evaluationDimensions: JSON.stringify([
        { name: '同理心', description: '能否理解双方立场', weight: 0.2 },
        { name: '表达清晰度', description: '能否清晰表达调解方案', weight: 0.2 },
        { name: '倾听能力', description: '能否让双方充分表达', weight: 0.2 },
        { name: '问题解决', description: '能否找到双方接受的方案', weight: 0.25 },
        { name: '情绪管理', description: '能否控制调解过程', weight: 0.15 }
      ]),
      estimatedDuration: 15
    },
    {
      title: '情绪安抚：员工工作压力过大',
      description: '一位核心员工因工作压力过大，情绪崩溃，您需要进行安抚和疏导。',
      category: 'EMOTIONAL',
      difficulty: 'BEGINNER',
      background: JSON.stringify({
        context: '该员工是项目核心成员，近期连续加班，今天在会议上情绪失控。',
        employeeProfile: {
          name: '刘洋',
          position: '项目经理',
          tenure: '3年',
          recentWorkload: '连续加班2个月',
          emotionalState: '焦虑、疲惫、接近崩溃'
        }
      }),
      aiCharacter: JSON.stringify({
        name: '刘洋',
        personality: '责任心强、追求完美、不善于表达困难',
        emotionalTriggers: ['被忽视', '更多任务', '不理解'],
        behaviorGuidelines: [
          '可能会哭泣',
          '会表达委屈和疲惫',
          '需要被倾听和理解',
          '可能会担心被认为能力不足'
        ]
      }),
      evaluationDimensions: JSON.stringify([
        { name: '同理心', description: '能否真正理解员工感受', weight: 0.3 },
        { name: '表达清晰度', description: '能否表达关心和支持', weight: 0.2 },
        { name: '倾听能力', description: '能否耐心倾听员工倾诉', weight: 0.25 },
        { name: '问题解决', description: '能否提出实际帮助方案', weight: 0.15 },
        { name: '情绪管理', description: '能否稳定员工情绪', weight: 0.1 }
      ]),
      estimatedDuration: 10
    },
    {
      title: '晋升沟通：告知晋升结果',
      description: '一位员工申请晋升，经过评估后您需要告知他晋升成功的结果。',
      category: 'PROMOTION',
      difficulty: 'BEGINNER',
      background: JSON.stringify({
        context: '该员工表现优秀，符合晋升条件，公司已批准其晋升申请。',
        employeeProfile: {
          name: '赵敏',
          position: '高级工程师',
          tenure: '4年',
          achievements: ['主导多个重点项目', '技术能力突出', '团队影响力强']
        }
      }),
      aiCharacter: JSON.stringify({
        name: '赵敏',
        personality: '自信、有野心、期待认可',
        emotionalTriggers: ['被认可', '被信任', '新挑战'],
        behaviorGuidelines: [
          '会表达开心和感谢',
          '可能会询问新职责',
          '会关心薪资调整',
          '会表达继续努力的决心'
        ]
      }),
      evaluationDimensions: JSON.stringify([
        { name: '同理心', description: '能否分享员工喜悦', weight: 0.2 },
        { name: '表达清晰度', description: '能否清晰说明晋升详情', weight: 0.25 },
        { name: '倾听能力', description: '能否倾听员工想法', weight: 0.15 },
        { name: '问题解决', description: '能否解答员工疑问', weight: 0.2 },
        { name: '情绪管理', description: '能否营造积极氛围', weight: 0.2 }
      ]),
      estimatedDuration: 10
    },
    {
      title: '日常反馈：表扬优秀表现',
      description: '一位员工在项目中表现突出，您需要给予正面反馈和表扬。',
      category: 'FEEDBACK',
      difficulty: 'BEGINNER',
      background: JSON.stringify({
        context: '该员工在最近的项目中主动承担责任，帮助团队解决了关键问题。',
        employeeProfile: {
          name: '周杰',
          position: '测试工程师',
          tenure: '1.5年',
          recentAchievement: '发现并修复了重大安全隐患'
        }
      }),
      aiCharacter: JSON.stringify({
        name: '周杰',
        personality: '踏实、低调、不太善于表达',
        emotionalTriggers: ['被认可', '被关注', '真诚的赞美'],
        behaviorGuidelines: [
          '可能会谦虚回应',
          '会表达感谢',
          '可能会有些不好意思',
          '会分享更多工作想法'
        ]
      }),
      evaluationDimensions: JSON.stringify([
        { name: '同理心', description: '能否真诚认可员工', weight: 0.25 },
        { name: '表达清晰度', description: '能否具体说明优秀之处', weight: 0.25 },
        { name: '倾听能力', description: '能否倾听员工想法', weight: 0.2 },
        { name: '问题解决', description: '能否鼓励持续进步', weight: 0.15 },
        { name: '情绪管理', description: '能否营造积极氛围', weight: 0.15 }
      ]),
      estimatedDuration: 8
    }
  ]

  for (const scenario of scenarios) {
    const created = await prisma.scenario.create({
      data: scenario
    })
    console.log(`✅ 创建剧本: ${created.title}`)
  }

  console.log('🎉 数据播种完成!')
}

main()
  .catch((e) => {
    console.error('❌ 播种失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
