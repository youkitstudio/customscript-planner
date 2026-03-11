"use client"

export default function GuidePage() {
  const handleClose = () => {
    window.close()
  }

  return (
    <>
      <style jsx global>{`
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Pretendard', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif;
            line-height: 1.6;
            color: #1A1A1A;
            background: #F8F8F8;
        }
        
        .container {
            max-width: 1000px;
            margin: 0 auto;
            padding: 40px 20px;
        }
        
        .main-header {
            background: white;
            border-radius: 12px;
            padding: 40px;
            margin-bottom: 30px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
            text-align: center;
        }
        
        .main-header h1 {
            font-size: 28px;
            font-weight: 700;
            color: #1A1A1A;
            margin-bottom: 8px;
        }
        
        .main-header p {
            font-size: 16px;
            color: #767676;
        }
        
        .section-card {
            background: white;
            border-radius: 12px;
            padding: 30px;
            margin-bottom: 20px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }
        
        .section-header {
            background: #256EF4;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            margin-bottom: 25px;
            font-size: 18px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .grid-2 {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin: 20px 0;
        }
        
        .box-card {
            background: #F8F8F8;
            border-radius: 8px;
            padding: 20px;
            border-left: 4px solid #0B7B3E;
        }
        
        .box-card.warning {
            border-left-color: #D32F2F;
            background: #FFF5F5;
        }
        
        .box-card.info {
            border-left-color: #256EF4;
            background: #EBF1FE;
        }
        
        .box-card h3 {
            font-size: 16px;
            font-weight: 700;
            color: #1A1A1A;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .box-card ul {
            list-style: none;
            padding: 0;
        }
        
        .box-card li {
            padding: 8px 0 8px 24px;
            position: relative;
            font-size: 14px;
            color: #474747;
        }
        
        .box-card li:before {
            content: "\\2022";
            position: absolute;
            left: 8px;
            color: #0B7B3E;
            font-weight: bold;
            font-size: 18px;
        }
        
        .box-card.warning li:before {
            color: #D32F2F;
        }
        
        .formula-box {
            background: #EBF1FE;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            margin: 20px 0;
            border: 2px dashed #256EF4;
            font-family: 'Courier New', monospace;
            font-size: 15px;
            font-weight: 600;
            color: #1A1A1A;
        }
        
        .badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
        }
        
        .badge-success {
            background: #D4EDDA;
            color: #0B7B3E;
        }
        
        .badge-warning {
            background: #FECACA;
            color: #D32F2F;
        }
        
        .badge-info {
            background: #EBF1FE;
            color: #256EF4;
        }
        
        .flow-container {
            margin: 25px 0;
            padding: 25px;
            background: #f7fafc;
            border-radius: 8px;
        }
        
        .flow-steps {
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 12px;
        }
        
        .flow-step {
            flex: 1;
            min-width: 100px;
            background: white;
            padding: 16px 12px;
            border-radius: 8px;
            text-align: center;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            font-weight: 600;
            font-size: 13px;
            color: #2d3748;
            border: 2px solid transparent;
            transition: all 0.2s;
        }
        
        .flow-step:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
            border-color: #256EF4;
        }
        
        .flow-step.highlight {
            background: #256EF4;
            color: white;
        }
        
        .flow-arrow {
            font-size: 20px;
            color: #256EF4;
            font-weight: bold;
        }
        
        .highlight-box {
            background: linear-gradient(135deg, #256EF4 0%, #0B50D0 100%);
            color: white;
            padding: 25px;
            border-radius: 12px;
            text-align: center;
            margin: 25px 0;
        }
        
        .highlight-box h3 {
            font-size: 20px;
            margin-bottom: 10px;
        }
        
        .highlight-box p {
            font-size: 16px;
            opacity: 0.95;
        }
        
        .checklist {
            background: #f7fafc;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        
        .checklist ul {
            list-style: none;
            padding: 0;
        }
        
        .checklist li {
            padding: 10px 0 10px 32px;
            position: relative;
            font-size: 14px;
            color: #2d3748;
        }
        
        .checklist li:before {
            content: "\\2610";
            position: absolute;
            left: 0;
            color: #256EF4;
            font-size: 20px;
        }
        
        .faq-item {
            background: #F8F8F8;
            padding: 18px;
            border-radius: 8px;
            margin-bottom: 12px;
            border-left: 4px solid #256EF4;
        }
        
        .faq-question {
            font-weight: 700;
            color: #2d3748;
            margin-bottom: 8px;
            font-size: 14px;
        }
        
        .faq-answer {
            color: #4a5568;
            font-size: 14px;
        }
        
        .close-button {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #256EF4;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            border: none;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(37, 110, 244, 0.3);
            transition: all 0.2s;
            z-index: 1000;
        }

        .close-button:hover {
            background: #0B50D0;
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(37, 110, 244, 0.4);
        }
        
        @media (max-width: 768px) {
            .grid-2 {
                grid-template-columns: 1fr;
            }
            
            .flow-steps {
                flex-direction: column;
            }
            
            .flow-arrow {
                transform: rotate(90deg);
            }
            
            .container {
                padding: 20px 15px;
            }
            
            .main-header {
                padding: 25px 20px;
            }
            
            .section-card {
                padding: 20px;
            }

            .close-button {
                top: 10px;
                right: 10px;
                padding: 10px 20px;
                font-size: 13px;
            }
        }
        
        @media print {
            body {
                background: white;
            }
            
            .section-card {
                box-shadow: none;
                page-break-inside: avoid;
            }

            .close-button {
                display: none;
            }
        }
      `}</style>

      <button onClick={handleClose} className="close-button">
        X 창 닫기
      </button>

      <div className="container">
        <div className="main-header">
          <h1>콘텐츠 원고 작성 가이드</h1>
          <p>타임라인 기반 콘텐츠 원고 작성 도구 사용법</p>
        </div>

        {/* 개요 */}
        <div className="section-card">
          <div className="section-header">
            <strong>1.</strong>
            도구 소개
          </div>
          <p>이 도구는 영상 콘텐츠의 나레이션 원고를 작성하고, 실시간으로 러닝타임을 체크할 수 있는 <strong>범용 콘텐츠 원고 작성 도구</strong>입니다.</p>
          <p style={{ marginTop: '10px' }}>학습 콘텐츠, 홍보 영상, 튜토리얼, 브이로그, 강의 등 다양한 형태의 콘텐츠에 활용할 수 있습니다.</p>
          
          <div className="grid-2" style={{ marginTop: '20px' }}>
            <div className="box-card">
              <h3>주요 기능</h3>
              <ul>
                <li>인터랙티브 타임라인으로 섹션 시간 조절</li>
                <li>실시간 러닝타임 자동 계산</li>
                <li>프로젝트 저장 (Markdown) 및 불러오기</li>
                <li>PDF 다운로드로 제작팀 공유</li>
                <li>자유로운 섹션 수, 러닝타임 설정</li>
              </ul>
            </div>
            <div className="box-card info">
              <h3>사용 환경</h3>
              <ul>
                <li>별도 로그인 없이 바로 사용 가능</li>
                <li>데스크톱/모바일 모두 지원</li>
                <li>.md 파일로 프로젝트 저장/복원</li>
                <li>반드시 저장 기능으로 백업 필요!</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 사용법 */}
        <div className="section-card">
          <div className="section-header">
            <strong>2.</strong>
            사용 방법
          </div>
          
          <div className="box-card" style={{ marginBottom: '20px' }}>
            <h3>Step 1. 프로젝트 설정</h3>
            <ul>
              <li><strong>프로젝트 명:</strong> 콘텐츠 제목을 입력하세요</li>
              <li><strong>콘텐츠 유형:</strong> 학습 콘텐츠, 홍보 영상, 튜토리얼 등 선택</li>
              <li><strong>러닝타임:</strong> 전체 목표 시간 (5분~60분)</li>
              <li><strong>섹션 수:</strong> 콘텐츠를 구성할 단위 (2~10개)</li>
            </ul>
          </div>

          <div className="box-card" style={{ marginBottom: '20px' }}>
            <h3>Step 2. 타임라인으로 시간 배분</h3>
            <ul>
              <li>컬러 블록의 경계선을 드래그하여 섹션별 시간을 조절합니다</li>
              <li>10초 단위로 스냅되며, 최소 30초 이상 유지됩니다</li>
              <li>빨간 삼각형 마커로 각 경계 시간을 확인할 수 있습니다</li>
              <li>타임라인 위에 마우스를 올리면 드래그 핸들이 나타납니다</li>
            </ul>
          </div>

          <div className="box-card" style={{ marginBottom: '20px' }}>
            <h3>Step 3. 원고 작성</h3>
            <ul>
              <li>각 섹션 카드에서 섹션 이름을 수정할 수 있습니다</li>
              <li>텍스트 입력 시 실시간으로 러닝타임이 계산됩니다</li>
              <li>카드 헤더를 클릭하면 접기/펼치기가 가능합니다</li>
              <li>글자 수와 예상 시간이 자동으로 표시됩니다</li>
            </ul>
          </div>

          <div className="box-card">
            <h3>Step 4. 저장 및 공유</h3>
            <ul>
              <li><strong>프로젝트 저장:</strong> .md 파일로 저장 (다음에 불러오기 가능)</li>
              <li><strong>프로젝트 불러오기:</strong> 저장한 .md 파일을 불러와 이어 작성</li>
              <li><strong>PDF 다운로드:</strong> 최종 원고를 PDF로 출력하여 공유</li>
            </ul>
          </div>
        </div>

        {/* 러닝타임 기준 */}
        <div className="section-card">
          <div className="section-header">
            <strong>3.</strong>
            러닝타임 계산 기준
          </div>
          
          <div className="box-card info" style={{ marginBottom: '20px' }}>
            <h3>자동 계산 기준</h3>
            <div className="formula-box">
              한글 기준 2분당 725자 = 초당 약 6.04자
            </div>
            <p style={{ marginTop: '15px', fontWeight: 600, color: '#2d3748' }}>예시:</p>
            <ul style={{ marginTop: '10px' }}>
              <li>300자 작성 - 약 50초</li>
              <li>725자 작성 - 약 2분</li>
              <li>1,450자 작성 - 약 4분</li>
            </ul>
          </div>
          
          <div className="box-card">
            <h3>적정 분량 기준</h3>
            <p style={{ fontSize: '20px', fontWeight: 700, color: '#48bb78', margin: '15px 0' }}>
              95% ~ 105%
            </p>
            <p style={{ marginBottom: '15px' }}>각 섹션의 목표 시간 대비 95%~105% 범위 내에서 작성하면 적정합니다.</p>
            
            <ul style={{ marginTop: '10px' }}>
              <li><span className="badge badge-success">95~105%</span> 적정 분량 (촬영 권장)</li>
              <li><span className="badge badge-warning">105% 초과</span> 원고 줄이기 필요</li>
              <li><span className="badge badge-info">95% 미만</span> 원고 추가 가능</li>
            </ul>
          </div>
        </div>

        {/* 작성 팁 */}
        <div className="section-card">
          <div className="section-header">
            <strong>4.</strong>
            원고 작성 팁
          </div>
          
          <div className="grid-2">
            <div className="box-card warning">
              <h3>피해야 할 것</h3>
              <ul>
                <li>105% 초과 (재촬영 원인)</li>
                <li>문어체, 딱딱한 표현</li>
                <li>섹션 간 내용 중복</li>
                <li>저장 없이 브라우저 종료</li>
                <li>너무 빠른 호흡의 문장</li>
                <li>전문 용어 남발</li>
              </ul>
            </div>
            
            <div className="box-card">
              <h3>해야 할 것</h3>
              <ul>
                <li>섹션별 목표 시간 확인하며 작성</li>
                <li>실시간 러닝타임 체크</li>
                <li>95~105% 구간 유지</li>
                <li>완성 후 반드시 프로젝트 저장</li>
                <li>자연스러운 구어체 사용</li>
                <li>감정 표현과 억양 고려</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 러닝타임 관리 */}
        <div className="section-card">
          <div className="section-header">
            <strong>5.</strong>
            러닝타임 관리 전략
          </div>
          
          <div className="grid-2">
            <div className="box-card warning">
              <h3>분량 초과 시 (105% 이상)</h3>
              <ul>
                <li>{"수식어 제거: \"매우 중요한\" -> \"중요한\""}</li>
                <li>중복 표현 삭제</li>
                <li>부연 설명 축약</li>
                <li>예시 개수 줄이기</li>
                <li>긴 문장 짧게 나누기</li>
              </ul>
            </div>
            
            <div className="box-card">
              <h3>분량 부족 시 (95% 미만)</h3>
              <ul>
                <li>구체적 예시 추가</li>
                <li>감정적 표현 강화</li>
                <li>전환 문장 추가</li>
                <li>설명 상세화</li>
                <li>비유와 은유 활용</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 제작 흐름도 */}
        <div className="section-card">
          <div className="section-header">
            <strong>6.</strong>
            제작 흐름도
          </div>
          
          <div className="flow-container">
            <div className="flow-steps">
              <div className="flow-step highlight">{"원고 작성"}<br />{"(이 도구)"}</div>
              <div className="flow-arrow">{">"}</div>
              <div className="flow-step">{"프로젝트"}<br />{"저장 (.md)"}</div>
              <div className="flow-arrow">{">"}</div>
              <div className="flow-step">{"PDF"}<br />{"다운로드"}</div>
              <div className="flow-arrow">{">"}</div>
              <div className="flow-step">{"제작팀"}<br />{"전달"}</div>
              <div className="flow-arrow">{">"}</div>
              <div className="flow-step">{"촬영/"}<br />{"녹음"}</div>
              <div className="flow-arrow">{">"}</div>
              <div className="flow-step highlight">{"완성"}</div>
            </div>
          </div>
        </div>

        {/* 체크리스트 */}
        <div className="section-card">
          <div className="section-header">
            <strong>7.</strong>
            작성 완료 체크리스트
          </div>
          
          <div className="checklist">
            <ul>
              <li>전체 러닝타임 95~105% 달성</li>
              <li>각 섹션 분량 적정 범위</li>
              <li>섹션 이름 모두 입력</li>
              <li>타임라인 시간 배분 적절</li>
              <li>프로젝트 저장 (.md) 완료</li>
              <li>PDF 다운로드 완료</li>
            </ul>
          </div>
        </div>

        {/* FAQ */}
        <div className="section-card">
          <div className="section-header">
            <strong>8.</strong>
            자주 묻는 질문 (FAQ)
          </div>
          
          <div className="faq-item">
            <div className="faq-question">Q. 작성 중 브라우저를 닫으면 데이터가 사라지나요?</div>
            <div className="faq-answer">A. 네, 브라우저를 닫으면 작성 중인 내용이 사라집니다. 반드시 "프로젝트 저장" 버튼으로 .md 파일을 저장하세요.</div>
          </div>
          
          <div className="faq-item">
            <div className="faq-question">Q. 타임라인 경계선을 드래그할 수 없어요.</div>
            <div className="faq-answer">A. 각 블록의 경계선 위에 마우스를 정확히 올려보세요. 커서가 좌우 화살표로 변경되면 드래그할 수 있습니다.</div>
          </div>
          
          <div className="faq-item">
            <div className="faq-question">Q. 저장한 .md 파일을 다시 불러올 수 있나요?</div>
            <div className="faq-answer">A. 네, "프로젝트 불러오기" 버튼을 클릭하여 이전에 저장한 .md 파일을 선택하면 모든 내용이 복원됩니다.</div>
          </div>
          
          <div className="faq-item">
            <div className="faq-question">Q. PDF가 여러 페이지로 나오는데 정상인가요?</div>
            <div className="faq-answer">A. 네, 분량에 따라 자동으로 페이지가 나뉩니다. 빈 줄 기준으로 최적의 페이지 분할이 이루어집니다.</div>
          </div>
        </div>

        {/* 마무리 */}
        <div className="section-card">
          <div className="highlight-box">
            <h3>효율적인 콘텐츠 제작을 위한 첫 걸음!</h3>
            <p>타임라인으로 시간을 미리 배분하고, 실시간 러닝타임 체크로<br />
            제작 기간과 비용을 절감하세요.</p>
          </div>
        </div>
      </div>
    </>
  )
}
